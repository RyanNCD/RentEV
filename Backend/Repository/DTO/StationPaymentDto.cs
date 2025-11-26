using System;
using System.ComponentModel.DataAnnotations;

namespace Repository.DTO
{
    // DTO cho thanh toán tại trạm
    public class StationPaymentCreateDto
    {
        [Required]
        public Guid RentalId { get; set; }

        [Required]
        public string PaymentMethod { get; set; } // "Cash", "BankTransfer", "PayOS"

        public string PaymentProofImageUrl { get; set; } // Ảnh chuyển khoản (nếu BankTransfer)
    }

    // DTO để staff tạo payment link PayOS tại trạm
    public class CreateStationPayOSPaymentDto
    {
        [Required]
        public Guid RentalId { get; set; }
    }
}

