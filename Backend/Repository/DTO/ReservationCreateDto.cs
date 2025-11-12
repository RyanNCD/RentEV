using System;

namespace Repository.DTO
{
    public class ReservationCreateDto
    {
        public Guid UserId { get; set; }
        public Guid VehicleId { get; set; }
        public Guid StationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; }
    }
}
