using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class VehicleDto
    {
        public Guid VehicleId { get; set; }

        public Guid StationId { get; set; }

        public string? VehicleName { get; set; }

        public string VehicleType { get; set; }

        public int? BatteryCapacity { get; set; }

        public string LicensePlate { get; set; }

        public string Status { get; set; }

        public decimal? PricePerDay { get; set; }

        public string Description { get; set; }

        public int? SeatingCapacity { get; set; }

        public string Utilities { get; set; }

        public int? NumberOfRenters { get; set; }
    }
}
