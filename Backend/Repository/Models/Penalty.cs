using System;
using System.ComponentModel.DataAnnotations;

namespace Repository.Models
{
    public class Penalty
    {
        [Key]
        public Guid PenaltyId { get; set; } = Guid.NewGuid();

        public string ViolationType { get; set; } // Ví dụ: "LateReturn", "Damage", "TrafficViolation", etc.

        public string Description { get; set; } // Mô tả vi phạm

        public decimal Amount { get; set; } // Số tiền phạt

        public bool IsActive { get; set; } = true; // Có đang áp dụng không

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}

