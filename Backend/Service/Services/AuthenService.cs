using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Service.Services
{
    public class AuthenService : IAuthenService
    {
        private readonly AuthenRepository _authenRepository;

        public AuthenService(AuthenRepository authenRepository)
        {
            _authenRepository = authenRepository;
        }

        public async Task<string> LoginWithToken(string email, string password)
        {
            
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email không được để trống");
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Mật khẩu không được để trống");

            return await _authenRepository.LoginAsync(email, password);
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

           
            return await _authenRepository.RegisterAsync(
                model.FullName,
                model.Email,
                model.Password,
                model.Phone,
                model.IdentityCard,
                model.DriverLicense
            );
        }

        
        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            // Regex email chuẩn
            return Regex.IsMatch(email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                RegexOptions.IgnoreCase);
        }

        private bool IsValidPhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            // Regex cho số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
            return Regex.IsMatch(phone, @"^(0|\+84)[0-9]{9}$");
        }

        private bool IsValidIdentityCard(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return false;
            // CCCD Việt Nam: 12 số
            return Regex.IsMatch(id, @"^[0-9]{12}$");
        }

        private bool IsValidDriverLicense(string license)
        {
            if (string.IsNullOrWhiteSpace(license)) return false;
            // Giả sử bằng lái xe gồm 12 ký tự chữ hoặc số
            return Regex.IsMatch(license, @"^[A-Z0-9]{12}$", RegexOptions.IgnoreCase);
        }
    }
}
