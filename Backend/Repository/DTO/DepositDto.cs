using System;

namespace Repository.DTO
{
    public class DepositDto
    {
        public Guid DepositId { get; set; }

        public Guid RentalId { get; set; }

        public Guid UserId { get; set; }

        public decimal Amount { get; set; }

        public decimal UsedAmount { get; set; }

        public decimal AvailableAmount { get; set; }

        public string Status { get; set; }

        public DateTime? PaymentDate { get; set; }

        public DateTime? RefundDate { get; set; }

        public string? RefundReason { get; set; }

        public DateTime? LastUsedAt { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class DepositCreateDto
    {
        public Guid RentalId { get; set; }

        public decimal Amount { get; set; }
    }
}

