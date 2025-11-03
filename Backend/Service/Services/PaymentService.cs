using Microsoft.Extensions.Options;
using Repository.Models;
using Repository.Repositories;
using Service.Configs;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using Microsoft.AspNetCore.Http;
using System.Text;
using System.Threading.Tasks;
using Service.Interface;

namespace Service.Services
{
    public class PaymentService: IPaymentService
    {
        private readonly PaymentRepository _repo;
        private readonly VnPayConfig _config;

        public PaymentService(PaymentRepository repo, IOptions<VnPayConfig> config)
        {
            _repo = repo;
            _config = config.Value;
        }

        public async Task<List<Payment>> GetAllPaymentsAsync()
        {
            return await _repo.GetAllAsync();
        }
        public async Task<Payment> GetPaymentById(Guid id)
        {
            return await _repo.GetByIdAsync(id);
        }
        public async Task<string> CreatePaymentUrlAsync(Payment payment, string ipAddress)
        {
            // Ensure PaymentId is set before saving
            if (payment.PaymentId == Guid.Empty)
            {
                payment.PaymentId = Guid.NewGuid();
            }

            // Set default values before saving
            if (payment.Status == null || string.IsNullOrWhiteSpace(payment.Status))
            {
                payment.Status = "Pending";
            }
            
            if (payment.PaymentDate == null)
            {
                payment.PaymentDate = DateTime.UtcNow;
            }

            if (payment.PaymentMethod == null || string.IsNullOrWhiteSpace(payment.PaymentMethod))
            {
                payment.PaymentMethod = "VnPay";
            }

            // Save payment to database
            await _repo.AddAsync(payment);

            var orderId = payment.PaymentId;

            var requestData = new Dictionary<string, string>
            {
                {"vnp_Version", "2.1.0"},
                {"vnp_Command", "pay"},
                {"vnp_TmnCode", _config.TmnCode},
                {"vnp_Amount", (payment.Amount * 100).ToString("0", System.Globalization.CultureInfo.InvariantCulture)},
                {"vnp_CurrCode", "VND"},
                {"vnp_TxnRef", orderId.ToString()},
                {"vnp_OrderInfo", "Thanh toan don hang " + orderId},
                {"vnp_OrderType", "other"},
                {"vnp_Locale", "vn"},
                {"vnp_ReturnUrl", _config.ReturnUrl},
                {"vnp_IpAddr", ipAddress},
                {"vnp_CreateDate", DateTime.UtcNow.ToString("yyyyMMddHHmmss", System.Globalization.CultureInfo.InvariantCulture)}
            };

            return await Task.FromResult(VnPayHelper.CreatePaymentUrl(_config.BaseUrl, _config.HashSecret, requestData));
        }

        public async Task<Payment> ProcessVnPayReturnAsync(Dictionary<string, string> queryParams)
        {
            // Validate the return first
            if (!VnPayHelper.ValidateReturn(queryParams, _config.HashSecret))
            {
                throw new Exception("Invalid payment signature");
            }

            // Extract payment information from VnPay return
            if (!queryParams.TryGetValue("vnp_TxnRef", out var txnRefStr) || 
                !Guid.TryParse(txnRefStr, out var paymentId))
            {
                throw new Exception("Invalid transaction reference");
            }

            if (!queryParams.TryGetValue("vnp_ResponseCode", out var responseCode))
            {
                throw new Exception("Missing response code");
            }

            // Get or create payment record
            var payment = await _repo.GetByIdAsync(paymentId);
            if (payment == null)
            {
                throw new Exception($"Payment with ID {paymentId} not found");
            }

            // Update payment status based on response code
            // "00" means success in VnPay
            if (responseCode == "00")
            {
                payment.Status = "Success";
            }
            else
            {
                payment.Status = "Failed";
            }

            // Update payment date from transaction date if available
            if (queryParams.TryGetValue("vnp_TransactionDate", out var transactionDateStr) &&
                DateTime.TryParseExact(transactionDateStr, "yyyyMMddHHmmss", 
                    System.Globalization.CultureInfo.InvariantCulture, 
                    System.Globalization.DateTimeStyles.None, out var transactionDate))
            {
                payment.PaymentDate = transactionDate;
            }
            else
            {
                payment.PaymentDate = DateTime.UtcNow;
            }

            // Update payment in database
            await _repo.UpdateAsync(payment);

            return payment;
        }

        // Implement HandleVnPayReturnAsync (kept for backward compatibility, but ProcessVnPayReturnAsync should be used)
        public async Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams)
        {
            return await Task.FromResult(VnPayHelper.ValidateReturn(queryParams, _config.HashSecret));
        }
    }
}
