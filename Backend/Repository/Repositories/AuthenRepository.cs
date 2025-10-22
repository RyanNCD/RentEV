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

        public async Task<string?> LoginAsync(string email, string password)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return null;

            // Kiểm tra mật khẩu
            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            // Tạo JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.RoleId.ToString())
        };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(4),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<User> RegisterAsync(string fullName, string email, string password, Guid roleId, string phoneNumber, string identityCard, string driverLicense)
        {
            // Normalize email
            email = email.Trim().ToLower();

            // Kiểm tra email trùng
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser != null)
                throw new ArgumentException("Email đã tồn tại.");

            // Kiểm tra role
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Customer");
            if (defaultRole == null)
                throw new InvalidOperationException("Không tìm thấy role mặc định 'Customer'.");

            // Hash mật khẩu
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            // Tạo user
            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = fullName,
                Email = email,
                PasswordHash = passwordHash,
                RoleId = roleId,
                Phone = phoneNumber,
                DriverLicense = driverLicense,
                IdentityCard = identityCard,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

    }
}
