using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class VehicleCreateDto
    {
        [Required]
        public Guid StationId { get; set; }

        [Required]
        [MaxLength(100)]
        public string VehicleName { get; set; }

        [Required]
        [MaxLength(50)]
        public string VehicleType { get; set; }

        public int? BatteryCapacity { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; } = "Available";

        public decimal? PricePerDay { get; set; }

        [MaxLength(20)]
        public string? LicensePlate { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public int? SeatingCapacity { get; set; }

        [MaxLength(200)]
        public string? Utilities { get; set; }

        [Required]
        public int NumberOfRenters { get; set; } = 0;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
