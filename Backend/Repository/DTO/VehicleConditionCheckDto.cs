using System;
using System.Collections.Generic;

namespace Repository.DTO
{
    public class VehicleConditionCheckDto
    {
        public List<string> ImageUrls { get; set; } = new List<string>();
        public string Note { get; set; }
        public string Description { get; set; }
    }
}
