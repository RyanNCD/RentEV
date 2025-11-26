using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;


namespace Service.Interface
{
    public interface IPaymentService
    {
        Task<List<Payment>> GetAllPaymentsAsync();
        Task<Payment> GetPaymentById(Guid id);
        Task<Payment?> GetPaymentByTransactionIdAsync(string transactionId);
        Task<string> CreatePaymentUrlAsync(Payment payment, string ipAddress);
        Task<Payment> ProcessVnPayReturnAsync(Dictionary<string, string> queryParams);
        Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams);
        Task<Net.payOS.Types.WebhookData> VerifyPayOSWebhookAsync(string rawBody);
        Task<Payment?> ConfirmPaymentAsync(Guid paymentId);
        Task<List<Payment>> GetPaymentsByRentalIdAsync(Guid rentalId);
        Task<bool> IsRentalPaidAsync(Guid rentalId);

        // Station payment methods
        Task<string> CreateStationPayOSPaymentAsync(Guid rentalId, Guid staffId, string ipAddress);
        Task<Payment> ConfirmStationPaymentAsync(Guid rentalId, string paymentMethod, Guid staffId, string? paymentProofImageUrl);
    }
}
