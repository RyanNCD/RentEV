using System;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Service.Configs;
using Service.Interface;

namespace Service.Services
{
    public class AuthenService : IAuthenService
    {
        private readonly AuthenRepository _authenRepository;
        private readonly ILogger<AuthenService> _logger;
        private readonly IEmailService _emailService;
        private readonly EmailSettings _emailSettings;

        private static readonly string[] RolesRequireOtp = new[]
        {
            "admin",
            "administrator",
            "staff",
            "staffstation",
            "stationstaff",
            "station_staff"
        };
        private static readonly TimeSpan VerificationTokenLifetime = TimeSpan.FromHours(24);
        private static readonly TimeSpan VerificationResendThreshold = TimeSpan.FromMinutes(30);
        private static readonly TimeSpan TrustedDeviceLifetime = TimeSpan.FromDays(30);

        public AuthenService(
            AuthenRepository authenRepository,
            IEmailService emailService,
            IOptions<EmailSettings> emailOptions,
            ILogger<AuthenService> logger)
        {
            _authenRepository = authenRepository;
            _emailService = emailService;
            _emailSettings = emailOptions.Value;
            _logger = logger;
        }

        public async Task<LoginResultDto> LoginAsync(string email, string password, string? deviceId = null)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email không được để trống");
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Mật khẩu không được để trống");

            var user = await _authenRepository.ValidateCredentialsAsync(email.Trim().ToLower(), password);
            if (user == null)
            {
                return new LoginResultDto
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không đúng."
                };
            }

            var normalizedRole = user.Role?.RoleName?.Trim().ToLowerInvariant() ?? string.Empty;
            var isPrivileged = RequiresOtp(normalizedRole);

            if (!isPrivileged && !user.IsEmailVerified)
            {
                var resent = await EnsureVerificationEmailSentAsync(user, force: false);
                return new LoginResultDto
                {
                    Success = false,
                    RequiresEmailVerification = true,
                    Message = resent
                        ? "Email của bạn chưa được xác thực. Chúng tôi vừa gửi lại email xác thực, vui lòng kiểm tra hòm thư."
                        : "Email của bạn chưa được xác thực. Vui lòng kiểm tra hòm thư."
                };
            }

            if (isPrivileged && IsTrustedDevice(user, deviceId))
            {
                var trustedToken = _authenRepository.GenerateJwtToken(user);
                return new LoginResultDto
                {
                    Success = true,
                    Token = trustedToken,
                    TrustedDeviceUsed = true
                };
            }

            if (!isPrivileged)
            {
                var token = _authenRepository.GenerateJwtToken(user);
                return new LoginResultDto
                {
                    Success = true,
                    Token = token
                };
            }

            if (isPrivileged)
            {
                var otpCode = GenerateOtpCode();
                var otp = await _authenRepository.CreateOtpAsync(
                    user,
                    "LOGIN",
                    otpCode,
                    DateTime.UtcNow.AddMinutes(5));

                await _emailService.SendOtpCodeAsync(user.Email, otpCode);
                _logger.LogDebug("OTP for user {Email}/{UserId}: {Otp}", user.Email, user.UserId, otpCode);

                return new LoginResultDto
                {
                    Success = false,
                    RequiresOtp = true,
                    OtpRequestId = otp.UserOtpId,
                    Message = "Mã OTP đã được gửi tới email của bạn."
                };
            }

            throw new InvalidOperationException("Không xác định được vai trò người dùng.");
        }

        public async Task<LoginResultDto> VerifyOtpAsync(Guid otpRequestId, string code, bool rememberDevice, string? deviceId = null)
        {
            if (otpRequestId == Guid.Empty)
                throw new ArgumentException("Mã OTP không hợp lệ.");
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Mã OTP không được để trống.");

            var otp = await _authenRepository.GetOtpAsync(otpRequestId);
            if (otp == null || otp.IsUsed || otp.ExpiresAt < DateTime.UtcNow)
            {
                return new LoginResultDto
                {
                    Success = false,
                    Message = "Mã OTP không hợp lệ hoặc đã hết hạn."
                };
            }

            if (!BCrypt.Net.BCrypt.Verify(code, otp.CodeHash))
            {
                return new LoginResultDto
                {
                    Success = false,
                    Message = "Mã OTP không chính xác."
                };
            }

            await _authenRepository.MarkOtpUsedAsync(otp);

            var user = otp.User ?? await _authenRepository.GetUserByIdAsync(otp.UserId);
            if (user == null)
            {
                return new LoginResultDto
                {
                    Success = false,
                    Message = "Không tìm thấy người dùng cho OTP này."
                };
            }

            var normalizedRole = user.Role?.RoleName?.Trim().ToLowerInvariant() ?? string.Empty;
            var isPrivileged = RequiresOtp(normalizedRole);

            if (!isPrivileged && !user.IsEmailVerified)
            {
                return new LoginResultDto
                {
                    Success = false,
                    RequiresEmailVerification = true,
                    Message = "Email của bạn chưa được xác thực."
                };
            }

            if (rememberDevice && isPrivileged && !string.IsNullOrWhiteSpace(deviceId))
            {
                await RememberDeviceAsync(user, deviceId);
            }

            var token = _authenRepository.GenerateJwtToken(user);
            return new LoginResultDto
            {
                Success = true,
                Token = token
            };
        }

        public async Task<User> RegisterAsync(UserRegisterDto model)
        {
            if (string.IsNullOrWhiteSpace(model.FullName))
                throw new ArgumentException("Họ tên không được để trống");

            if (!IsValidEmail(model.Email))
                throw new ArgumentException("Email không hợp lệ");

            if (!IsValidPhone(model.Phone))
                throw new ArgumentException("Số điện thoại không hợp lệ");

            if (!IsValidIdentityCard(model.IdentityCard))
                throw new ArgumentException("Số căn cước công dân không hợp lệ");

            if (!IsValidDriverLicense(model.DriverLicense))
                throw new ArgumentException("Số bằng lái xe không hợp lệ");

            var verificationToken = GenerateVerificationToken();
            var tokenExpiresAt = DateTime.UtcNow.Add(VerificationTokenLifetime);

            var user = await _authenRepository.RegisterAsync(
                model.FullName,
                model.Email,
                model.Password,
                model.Phone,
                model.IdentityCard,
                model.DriverLicense,
                verificationToken,
                tokenExpiresAt
            );

            var verificationLink = BuildVerificationLink(verificationToken);
            await _emailService.SendEmailVerificationAsync(user.Email, verificationLink);

            return user;
        }

        public async Task VerifyEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new ArgumentException("Token không hợp lệ.");

            var user = await _authenRepository.GetUserByVerificationTokenAsync(token);
            if (user == null || user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
                throw new ArgumentException("Token xác thực không hợp lệ hoặc đã hết hạn.");

            if (user.IsEmailVerified)
                return;

            user.IsEmailVerified = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiresAt = null;

            await _authenRepository.UpdateUserAsync(user);
        }

        public async Task ResendVerificationEmailAsync(string email)
        {
            if (!IsValidEmail(email))
                throw new ArgumentException("Email không hợp lệ");

            var user = await _authenRepository.GetUserByEmailAsync(email.Trim().ToLower());
            if (user == null)
                throw new ArgumentException("Không tìm thấy tài khoản với email này.");

            if (user.IsEmailVerified)
                throw new InvalidOperationException("Email đã được xác thực trước đó.");

            await EnsureVerificationEmailSentAsync(user, force: true);
        }

        private string BuildVerificationLink(string token)
        {
            var baseUrl = string.IsNullOrWhiteSpace(_emailSettings.FrontendBaseUrl)
                ? "http://localhost:5173"
                : _emailSettings.FrontendBaseUrl.TrimEnd('/');

            return $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
        }

        private async Task<bool> EnsureVerificationEmailSentAsync(User user, bool force)
        {
            var needNewToken = force
                || string.IsNullOrWhiteSpace(user.EmailVerificationToken)
                || !user.EmailVerificationTokenExpiresAt.HasValue
                || user.EmailVerificationTokenExpiresAt.Value < DateTime.UtcNow
                || TokenSentMoreThanThresholdAgo(user.EmailVerificationTokenExpiresAt.Value);

            if (!needNewToken)
            {
                return false;
            }

            var token = GenerateVerificationToken();
            user.EmailVerificationToken = token;
            user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.Add(VerificationTokenLifetime);
            await _authenRepository.UpdateUserAsync(user);

            var verificationLink = BuildVerificationLink(token);
            await _emailService.SendEmailVerificationAsync(user.Email, verificationLink);
            return true;
        }

        private static bool TokenSentMoreThanThresholdAgo(DateTime expiresAt)
        {
            var sentAt = expiresAt - VerificationTokenLifetime;
            return DateTime.UtcNow - sentAt > VerificationResendThreshold;
        }

        private static string GenerateVerificationToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        }

        private static bool IsTrustedDevice(User user, string? deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return false;
            if (string.IsNullOrWhiteSpace(user.TrustedDeviceHash) || !user.TrustedDeviceExpiresAt.HasValue)
                return false;
            if (user.TrustedDeviceExpiresAt.Value < DateTime.UtcNow)
                return false;

            return BCrypt.Net.BCrypt.Verify(deviceId, user.TrustedDeviceHash);
        }

        private async Task RememberDeviceAsync(User user, string deviceId)
        {
            user.TrustedDeviceHash = BCrypt.Net.BCrypt.HashPassword(deviceId);
            user.TrustedDeviceExpiresAt = DateTime.UtcNow.Add(TrustedDeviceLifetime);
            await _authenRepository.UpdateUserAsync(user);
        }

        private static string GenerateOtpCode()
        {
            var number = RandomNumberGenerator.GetInt32(0, 1000000);
            return number.ToString("D6");
        }

        private static bool RequiresOtp(string normalizedRole)
        {
            if (string.IsNullOrWhiteSpace(normalizedRole)) return false;
            foreach (var role in RolesRequireOtp)
            {
                if (normalizedRole.Equals(role, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return Regex.IsMatch(email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                RegexOptions.IgnoreCase);
        }

        private static bool IsValidPhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            return Regex.IsMatch(phone, @"^(0|\+84)[0-9]{9}$");
        }

        private static bool IsValidIdentityCard(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return false;
            return Regex.IsMatch(id, @"^[0-9]{12}$");
        }

        private static bool IsValidDriverLicense(string license)
        {
            if (string.IsNullOrWhiteSpace(license)) return false;
            return Regex.IsMatch(license, @"^[A-Z0-9]{12}$", RegexOptions.IgnoreCase);
        }
    }
}
