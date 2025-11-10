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
            var user = await _context.Users
                .Include(u => u.Role) // ✅ load role
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return null;
            var storedHash = user.PasswordHash?.Trim();
            if (string.IsNullOrEmpty(storedHash))
                return null;

            // Normalize PHP-style bcrypt prefixes to a supported version
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

            if (!verified)
                return null;

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        // Trim role name to avoid whitespace causing [Authorize(Roles=...)] mismatches
        new Claim(ClaimTypes.Role, (user.Role?.RoleName ?? string.Empty).Trim())
    };

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


        public async Task<User> RegisterAsync(string fullName, string email, string password, string phoneNumber, string identityCard, string driverLicense)
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
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }


    }
}
