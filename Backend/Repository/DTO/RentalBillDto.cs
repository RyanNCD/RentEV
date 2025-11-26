using System;
using System.Collections.Generic;

namespace Repository.DTO
{
    public class RentalBillDto
    {
        public Guid RentalId { get; set; }

        public decimal RentalCost { get; set; } // Tiền thuê xe

        public decimal DepositAmount { get; set; } // Tiền cọc

        public decimal PenaltyAmount { get; set; } // Tổng tiền phạt

        public decimal TotalAmount { get; set; } // Tổng cộng (RentalCost + PenaltyAmount)

        public List<RentalPenaltyDto> Penalties { get; set; } = new List<RentalPenaltyDto>();

        public DepositDto? Deposit { get; set; }

        public decimal? RefundAmount { get; set; } // Số tiền hoàn lại (Deposit - PenaltyAmount nếu có)
    }

    public class CalculateRentalCostDto
    {
        public Guid VehicleId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }
    }

    public class CalculateRentalCostResponse
    {
        public int Days { get; set; }

        public decimal DailyRate { get; set; }

        public decimal RentalCost { get; set; }

        public decimal DepositAmount { get; set; } // Thường là 30-50% của RentalCost

        public bool IsValid { get; set; }

        public string? ValidationMessage { get; set; }
    }
}

