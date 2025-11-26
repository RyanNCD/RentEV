using System;
using System.ComponentModel.DataAnnotations;

namespace Repository.Models
{
    public class RentalPenalty
    {
        [Key]
        public Guid RentalPenaltyId { get; set; } = Guid.NewGuid();

        public Guid RentalId { get; set; }

        public Guid PenaltyId { get; set; }

        public decimal Amount { get; set; } // Số tiền phạt (có thể khác với Penalty.Amount nếu có điều chỉnh)

        public string Description { get; set; } // Mô tả chi tiết vi phạm

        public string Status { get; set; } = "Pending"; // Pending, Settled, OffsetFromDeposit, Waived

        public decimal PaidAmount { get; set; } = 0m; // Tổng tiền đã thu từ khách

        public decimal DepositUsedAmount { get; set; } = 0m; // Số tiền đã trừ từ cọc

        public string? PaymentMethod { get; set; } // Cash, PayOS, Deposit

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PaidAt { get; set; }

        public virtual Rental Rental { get; set; }

        public virtual Penalty Penalty { get; set; }
    }
}

