using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class ContractDto
    {
        public Guid ContractId { get; set; }

        public Guid UserId { get; set; }

        public Guid VehicleId { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string Terms { get; set; }

        public decimal? TotalAmount { get; set; }

        public string Status { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
