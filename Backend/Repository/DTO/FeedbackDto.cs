using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class FeedbackDto
    {
        public Guid FeedbackId { get; set; }

        public Guid UserId { get; set; }

        public Guid RentalId { get; set; }

        public int? Rating { get; set; }

        public string Comment { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
