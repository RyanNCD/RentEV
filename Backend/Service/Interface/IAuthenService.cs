using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IAuthenService
    {
        Task<LoginResultDto> LoginAsync(string email, string password, string? deviceId = null);
        Task<LoginResultDto> VerifyOtpAsync(Guid otpRequestId, string code, bool rememberDevice, string? deviceId = null);
        Task<User> RegisterAsync(UserRegisterDto model);
        Task VerifyEmailAsync(string token);
        Task ResendVerificationEmailAsync(string email);
    }
}
