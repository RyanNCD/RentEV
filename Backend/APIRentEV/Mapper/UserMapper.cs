using Microsoft.AspNetCore.Identity;
using Repository.DTO;
using Repository.Models;

namespace Api.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(this User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                IdentityCard = user.IdentityCard,
                DriverLicense = user.DriverLicense,
                RoleId = user.RoleId,
                CreatedAt = user.CreatedAt
            };
        }
        public static User ToEntity(this UserCreateDto dto)
        {
            return new User
            {
                UserId = Guid.NewGuid(),
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash),
                IdentityCard = dto.IdentityCard,
                DriverLicense = dto.DriverLicense,
                RoleId = dto.RoleId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static void MapUpdate(this UserUpdateDto dto, User user)
        {
            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.IdentityCard = dto.IdentityCard;
            user.DriverLicense = dto.DriverLicense;
            user.RoleId = dto.RoleId;
        }
    }
}
