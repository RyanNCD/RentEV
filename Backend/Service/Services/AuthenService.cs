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

        public Task<User> RegisterAsync(string fullName, string email, string password, Guid roleId, string phoneNumber, string identityCard, string driverLicense)
        {
           return _authenRepository.RegisterAsync(fullName, email, password, roleId, phoneNumber, identityCard, driverLicense);
        }
    }
}
