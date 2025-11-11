using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class FeedbackCreateDto
    {
        // UserId is optional - will be extracted from JWT token on backend
        public Guid? UserId { get; set; }

        public Guid RentalId { get; set; }

        public int? Rating { get; set; }

        public string? Comment { get; set; }

        // CreatedAt is optional - will be set on backend
        public DateTime? CreatedAt { get; set; }
    }
}
