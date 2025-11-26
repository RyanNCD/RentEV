using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string toEmail, string verificationLink);
        Task SendOtpCodeAsync(string toEmail, string otpCode);
    }
}




