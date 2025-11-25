using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class AuthenRepository 
    {
        private readonly SWP391RentEVContext _context;
        private readonly IConfiguration _config;

        public AuthenRepository(SWP391RentEVContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<User> RegisterAsync(
            string fullName,
            string email,
            string password,
            string phoneNumber,
            string identityCard,
            string driverLicense,
            string verificationToken,
            DateTime tokenExpiresAt)
        {
            email = email.Trim().ToLower();

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser != null)
                throw new ArgumentException("Email đã tồn tại.");

            // Lấy role mặc định 'Customer'
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Customer");
            if (defaultRole == null)
                throw new InvalidOperationException("Không tìm thấy role mặc định 'Customer'.");

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = fullName,
                Email = email,
                PasswordHash = passwordHash,
                RoleId = defaultRole.RoleId, // Gán role mặc định
                Phone = phoneNumber,
                DriverLicense = driverLicense,
                IdentityCard = identityCard,
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiresAt = tokenExpiresAt
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<User?> ValidateCredentialsAsync(string email, string password)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Station)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return null;

            var storedHash = user.PasswordHash?.Trim();
            if (string.IsNullOrEmpty(storedHash))
                return null;

            if (storedHash.StartsWith("$2y$"))
                storedHash = "$2a$" + storedHash.Substring(4);
            else if (storedHash.StartsWith("$2x$"))
                storedHash = "$2a$" + storedHash.Substring(4);

            bool verified;
            try
            {
                verified = BCrypt.Net.BCrypt.Verify(password, storedHash);
            }
            catch
            {
                return null;
            }

            return verified ? user : null;
        }

        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, (user.Role?.RoleName ?? string.Empty).Trim())
            };

            if (user.StationId.HasValue)
            {
                claims.Add(new Claim("stationId", user.StationId.Value.ToString()));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(3),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<User?> GetUserByVerificationTokenAsync(string token)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
        }

        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Station)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Station)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<UserOtp> CreateOtpAsync(User user, string purpose, string otpCode, DateTime expiresAt)
        {
            var otp = new UserOtp
            {
                UserOtpId = Guid.NewGuid(),
                UserId = user.UserId,
                Purpose = purpose,
                CodeHash = BCrypt.Net.BCrypt.HashPassword(otpCode),
                ExpiresAt = expiresAt,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserOtps.Add(otp);
            await _context.SaveChangesAsync();
            return otp;
        }

        public async Task<UserOtp?> GetOtpAsync(Guid otpId)
        {
            return await _context.UserOtps
                .Include(o => o.User)
                .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(o => o.UserOtpId == otpId);
        }

        public async Task MarkOtpUsedAsync(UserOtp otp)
        {
            otp.IsUsed = true;
            _context.UserOtps.Update(otp);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}
