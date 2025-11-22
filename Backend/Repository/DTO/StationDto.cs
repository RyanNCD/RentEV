using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class StationDto
    {
        public Guid StationId { get; set; }

        public string StationName { get; set; }

        public string Address { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
