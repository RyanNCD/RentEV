using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
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
            return await _authenRepository.LoginAsync(email, password);
        }

        public Task<User> RegisterAsync(UserRegisterDto model)
        {
            return _authenRepository.RegisterAsync(model.FullName, model.Email, model.Password, model.Phone, model.IdentityCard, model.DriverLicense);
        }

    }
}
