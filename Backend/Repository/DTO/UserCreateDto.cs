using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class UserCreateDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string PasswordHash { get; set; } // nếu có encrypt thì xử lý ở service
        public string IdentityCard { get; set; }
        public string DriverLicense { get; set; }
        public Guid RoleId { get; set; }
    }
}
