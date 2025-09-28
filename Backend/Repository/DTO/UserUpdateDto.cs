using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class UserUpdateDto
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string IdentityCard { get; set; }
        public string DriverLicense { get; set; }
        public Guid RoleId { get; set; }
    }
}
