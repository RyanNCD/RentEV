using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Service.Configs;
using Service.Interface;

namespace Service.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> options)
        {
            _settings = options.Value;
        }

        public Task SendEmailVerificationAsync(string toEmail, string verificationLink)
        {
            var subject = "Xác thực email tài khoản GreenGo";
            var body = $@"
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản GreenGo. Vui lòng bấm vào liên kết bên dưới để xác thực email:</p>
                <p><a href=""{verificationLink}"">Xác thực email của tôi</a></p>
                <p>Liên kết này chỉ có hiệu lực trong 24 giờ.</p>
                <p>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
                <p>GreenGo Team</p>";
            return SendAsync(toEmail, subject, body);
        }

        public Task SendOtpCodeAsync(string toEmail, string otpCode)
        {
            var subject = "Mã OTP đăng nhập GreenGo";
            var body = $@"
                <p>Chào bạn,</p>
                <p>Mã OTP đăng nhập của bạn là:</p>
                <p style=""font-size:24px;font-weight:bold;"">{otpCode}</p>
                <p>Mã có hiệu lực trong 5 phút. Không chia sẻ OTP cho bất kỳ ai.</p>
                <p>GreenGo Team</p>";
            return SendAsync(toEmail, subject, body);
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            using var client = new SmtpClient(_settings.SmtpServer, _settings.Port)
            {
                EnableSsl = _settings.UseSsl,
                Credentials = new NetworkCredential(_settings.Username, _settings.Password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
        }
    }
}



