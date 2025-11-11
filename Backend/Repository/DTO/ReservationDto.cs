using System;

namespace Repository.DTO
{
    public class ReservationDto
    {
        public Guid ReservationId { get; set; }
        public Guid UserId { get; set; }
        public Guid VehicleId { get; set; }
        public Guid StationId { get; set; }
        public DateTime? ReservedAt { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; }
    }
}
