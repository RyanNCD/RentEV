using System;

namespace Repository.DTO
{
    public class UserDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string IdentityCard { get; set; }
        public string DriverLicense { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public bool IsBlacklisted { get; set; }
    }
}
