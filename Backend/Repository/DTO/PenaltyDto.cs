using System;

namespace Repository.DTO
{
    public class PenaltyDto
    {
        public Guid PenaltyId { get; set; }

        public string ViolationType { get; set; }

        public string Description { get; set; }

        public decimal Amount { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    public class RentalPenaltyDto
    {
        public Guid RentalPenaltyId { get; set; }

        public Guid RentalId { get; set; }

        public Guid PenaltyId { get; set; }

        public decimal Amount { get; set; }

        public string Description { get; set; }

        public string Status { get; set; }

        public decimal PaidAmount { get; set; }

        public decimal DepositUsedAmount { get; set; }

        public string? PaymentMethod { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? PaidAt { get; set; }

        public PenaltyDto? Penalty { get; set; }
    }

    public class CreateRentalPenaltyDto
    {
        public Guid PenaltyId { get; set; }
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        /// <summary>
        /// Nếu true thì ưu tiên trừ vào cọc trước (nếu còn tiền)
        /// </summary>
        public bool UseDepositFirst { get; set; } = true;
    }

    public class SettleRentalPenaltyDto
    {
        public decimal PaymentAmount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // Cash, PayOS, Deposit
        public bool UseDeposit { get; set; }
        public string? Note { get; set; }
    }
}

