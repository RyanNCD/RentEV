using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class VehicleUpdateDto
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
        public string? Status { get; set; }

        public decimal? PricePerDay { get; set; }

        [MaxLength(20)]
        public string? LicensePlate { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public int? SeatingCapacity { get; set; }

        [MaxLength(200)]
        public string? Utilities { get; set; }

        // NumberOfRenters is calculated from Reservations, not updated manually
        // public int NumberOfRenters { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
