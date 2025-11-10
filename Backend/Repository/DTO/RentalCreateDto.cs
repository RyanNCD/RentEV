using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class RentalCreateDto
    {
        public Guid? ContractId { get; set; }

        public Guid UserId { get; set; }

        public Guid VehicleId { get; set; }

        public Guid PickupStationId { get; set; }

        public Guid? ReturnStationId { get; set; }

        public Guid? StaffId { get; set; }

        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public decimal? TotalCost { get; set; }

        public string Status { get; set; }

    }
}
