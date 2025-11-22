using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class ContractUpdateDto
    {
        public DateTime? EndDate { get; set; }
        public string? Terms { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
    }
}
