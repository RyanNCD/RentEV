using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class Login
    {
        public string Email { get; set; }

        public string Phone { get; set; }

        public string PasswordHash { get; set; }
    }
}
