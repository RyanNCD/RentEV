using System;

namespace Repository.DTO
{
    public class RentalImageDto
    {
        public Guid ImageId { get; set; }
        public Guid RentalId { get; set; }
        public string ImageUrl { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string Note { get; set; }
    }
}
