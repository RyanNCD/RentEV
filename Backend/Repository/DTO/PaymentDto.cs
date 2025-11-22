using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class PaymentDto
    {
        public Guid PaymentId { get; set; }

        public Guid RentalId { get; set; }

        public Guid UserId { get; set; }

        public decimal Amount { get; set; }

        public DateTime? PaymentDate { get; set; }

        public string PaymentMethod { get; set; }

        public string Type { get; set; }

        public string Status { get; set; }

        // Mã giao dịch PayOS để xác thực
        public string TransactionId { get; set; }
    }
}
