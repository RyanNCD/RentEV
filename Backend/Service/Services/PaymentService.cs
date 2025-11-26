using Microsoft.Extensions.Options;
using Repository.Models;
using Repository.Repositories;
using Repository.Implementations;
using Service.Configs;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using Microsoft.AspNetCore.Http;
using System.Text;
using System.Threading.Tasks;
using Service.Interface;
using Net.payOS;
using Net.payOS.Types;
using System.Text.Json;

namespace Service.Services
{
    public class PaymentService: IPaymentService
    {
        private readonly PaymentRepository _repo;
        private readonly RentalRepository _rentalRepo;
        private readonly PayOSConfig _config;
        private readonly PayOS _payOS;

        public PaymentService(PaymentRepository repo, RentalRepository rentalRepo, IOptions<PayOSConfig> config)
        {
            _repo = repo;
            _rentalRepo = rentalRepo;
            _config = config.Value;
            _payOS = new PayOS(_config.ClientId, _config.ApiKey, _config.ChecksumKey);
        }

        public async Task<List<Payment>> GetAllPaymentsAsync()
        {
            return await _repo.GetAllAsync();
        }
        public async Task<Payment> GetPaymentById(Guid id)
        {
            return await _repo.GetByIdAsync(id);
        }
        public async Task<Payment?> GetPaymentByTransactionIdAsync(string transactionId)
        {
            return await _repo.GetByTransactionIdAsync(transactionId);
        }
        public async Task<List<Payment>> GetPaymentsByRentalIdAsync(Guid rentalId)
        {
            return await _repo.GetByRentalIdAsync(rentalId);
        }
        public async Task<bool> IsRentalPaidAsync(Guid rentalId)
        {
            // Prefer efficient existence check
            var hasSuccess = await _repo.HasSuccessfulPaymentAsync(rentalId);
            if (hasSuccess) return true;

            // Fallback defensive check in case provider is case-sensitive or status varies
            var payments = await _repo.GetByRentalIdAsync(rentalId);
            return payments.Any(p => !string.IsNullOrWhiteSpace(p.Status) &&
                                     string.Equals(p.Status.Trim(), "Success", StringComparison.OrdinalIgnoreCase));
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
                payment.PaymentMethod = "PayOS";
            }

            // Fallback: if client sends amount <= 0, compute from rental
            if (payment.Amount <= 0)
            {
                var rental = await _rentalRepo.GetByIdAsync(payment.RentalId);
                if (rental != null)
                {
                    decimal computed = 0m;
                    if (rental.TotalCost.HasValue && rental.TotalCost.Value > 0)
                    {
                        computed = rental.TotalCost.Value;
                    }
                    else if (rental.StartTime.HasValue && rental.EndTime.HasValue)
                    {
                        var start = rental.StartTime.Value;
                        var end = rental.EndTime.Value;
                        if (end > start)
                        {
                            var days = Math.Ceiling((end - start).TotalDays);
                            var pricePerDay = rental.PricePerDaySnapshot ?? rental.Vehicle?.PricePerDay ?? 0m;
                            computed = (decimal)days * pricePerDay;
                        }
                    }

                    if (computed > 0)
                    {
                        payment.Amount = computed;
                    }
                }
            }

            // Generate a safe orderCode within 32-bit range to satisfy SDK constraints
            // Use current Unix time in seconds (fits under Int32.MaxValue until 2038)
            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Lưu mã giao dịch (TransactionId) phục vụ xác thực về sau
            // [Inference] PayOS webhook xác thực dựa trên orderCode.
            payment.TransactionId = orderCode.ToString();

            // Save payment to database (đã có TransactionId)
            await _repo.AddAsync(payment);

            // Build items list (single rental item)
            var unitAmount = (int)Math.Round(payment.Amount);
            var item = new ItemData("Thuê xe", 1, unitAmount);
            var items = new List<ItemData> { item };
            var cancelUrl = _config.ReturnUrl ?? "";
            var returnUrl = _config.ReturnUrl ?? "";

            var paymentData = new PaymentData(
                orderCode,
                unitAmount,
                "Thanh toan thue xe",
                items,
                cancelUrl,
                returnUrl
            );

            CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);
            return createPayment.checkoutUrl;
        }

        public async Task<Payment> ProcessVnPayReturnAsync(Dictionary<string, string> queryParams)
        {
            // VNPay integration removed. No processing available.
            throw new NotSupportedException("VNPay return processing is no longer supported.");
            }

        // Implement HandleVnPayReturnAsync (kept for backward compatibility, but ProcessVnPayReturnAsync should be used)
        public async Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams)
            {
            // VNPay integration removed.
            return await Task.FromResult(false);
            }

        public async Task<WebhookData> VerifyPayOSWebhookAsync(string rawBody)
            {
            // Deserialize raw JSON body into SDK's WebhookType then verify using SDK
            var webhookBody = JsonSerializer.Deserialize<WebhookType>(rawBody);
            var verified = _payOS.verifyPaymentWebhookData(webhookBody);
            return await Task.FromResult(verified);
            }

        public async Task<Payment?> ConfirmPaymentAsync(Guid paymentId)
            {
            var payment = await _repo.GetByIdAsync(paymentId);
            if (payment == null) return null;
                payment.Status = "Success";
            payment.PaymentDate = DateTime.UtcNow;
            await _repo.UpdateAsync(payment);

            // Update related rental to reflect successful payment
            var rental = await _rentalRepo.GetByIdAsync(payment.RentalId);
            if (rental != null)
            {
                // If rental total cost is not set, use paid amount
                if (!rental.TotalCost.HasValue || rental.TotalCost.Value <= 0)
            {
                    rental.TotalCost = payment.Amount;
            }
                // Mark rental as paid (use upper-case to match FE checks)
                rental.Status = "PAID"; // [Inference] FE expects "PAID" to show check-in button

                await _rentalRepo.UpdateAsync(rental);
        }

            return payment;
        }

        // Tạo payment link PayOS tại trạm (staff tạo cho khách)
        public async Task<string> CreateStationPayOSPaymentAsync(Guid rentalId, Guid staffId, string ipAddress)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
            {
                throw new InvalidOperationException("Rental not found.");
            }

            // Tính toán amount từ rental
            decimal amount = 0m;
            if (rental.TotalCost.HasValue && rental.TotalCost.Value > 0)
            {
                amount = rental.TotalCost.Value;
            }
            else if (rental.StartTime.HasValue && rental.EndTime.HasValue)
            {
                var start = rental.StartTime.Value;
                var end = rental.EndTime.Value;
                if (end > start)
                {
                    var days = Math.Ceiling((end - start).TotalDays);
                    var pricePerDay = rental.PricePerDaySnapshot ?? rental.Vehicle?.PricePerDay ?? 0m;
                    amount = (decimal)days * pricePerDay;
                }
            }

            if (amount <= 0)
            {
                throw new InvalidOperationException("Cannot determine rental amount.");
            }

            // Tạo payment với status Pending
            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                RentalId = rentalId,
                UserId = rental.UserId,
                Amount = amount,
                PaymentMethod = "PayOS",
                Type = "Rental",
                Status = "Pending",
                PaymentDate = DateTime.UtcNow
            };

            // Generate orderCode
            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            payment.TransactionId = orderCode.ToString();

            // Save payment
            await _repo.AddAsync(payment);

            // Create PayOS payment link
            var unitAmount = (int)Math.Round(amount);
            var item = new ItemData("Thuê xe", 1, unitAmount);
            var items = new List<ItemData> { item };
            var cancelUrl = _config.ReturnUrl ?? "";
            var returnUrl = _config.ReturnUrl ?? "";

            var paymentData = new PaymentData(
                orderCode,
                unitAmount,
                "Thanh toan thue xe tai tram",
                items,
                cancelUrl,
                returnUrl
            );

            CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);
            return createPayment.checkoutUrl;
        }

        // Xác nhận thanh toán tại trạm (Cash hoặc BankTransfer)
        public async Task<Payment> ConfirmStationPaymentAsync(Guid rentalId, string paymentMethod, Guid staffId, string? paymentProofImageUrl)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
            {
                throw new InvalidOperationException("Rental not found.");
            }

            // Tính toán amount
            decimal amount = 0m;
            if (rental.TotalCost.HasValue && rental.TotalCost.Value > 0)
            {
                amount = rental.TotalCost.Value;
            }
            else if (rental.StartTime.HasValue && rental.EndTime.HasValue)
            {
                var start = rental.StartTime.Value;
                var end = rental.EndTime.Value;
                if (end > start)
                {
                    var days = Math.Ceiling((end - start).TotalDays);
                    var pricePerDay = rental.PricePerDaySnapshot ?? rental.Vehicle?.PricePerDay ?? 0m;
                    amount = (decimal)days * pricePerDay;
                }
            }

            if (amount <= 0)
            {
                throw new InvalidOperationException("Cannot determine rental amount.");
            }

            // Validate payment method
            if (paymentMethod != "Cash" && paymentMethod != "BankTransfer")
            {
                throw new InvalidOperationException("Invalid payment method. Only Cash or BankTransfer allowed for station payment.");
            }

            // Validate proof image for BankTransfer
            if (paymentMethod == "BankTransfer" && string.IsNullOrWhiteSpace(paymentProofImageUrl))
            {
                throw new InvalidOperationException("Payment proof image is required for BankTransfer.");
            }

            // Tạo payment mới hoặc cập nhật payment đã có
            var existingPayments = await _repo.GetByRentalIdAsync(rentalId);
            Payment payment;

            // Nếu đã có payment Pending, cập nhật nó
            var pendingPayment = existingPayments.FirstOrDefault(p => p.Status == "Pending");
            if (pendingPayment != null)
            {
                payment = pendingPayment;
                payment.PaymentMethod = paymentMethod;
                payment.PaymentProofImageUrl = paymentProofImageUrl;
                payment.ConfirmedByStaffId = staffId;
            }
            else
            {
                // Tạo payment mới
                payment = new Payment
                {
                    PaymentId = Guid.NewGuid(),
                    RentalId = rentalId,
                    UserId = rental.UserId,
                    Amount = amount,
                    PaymentMethod = paymentMethod,
                    Type = "Rental",
                    Status = "Success",
                    PaymentDate = DateTime.UtcNow,
                    PaymentProofImageUrl = paymentProofImageUrl,
                    ConfirmedByStaffId = staffId
                };
                await _repo.AddAsync(payment);
            }

            // Cập nhật status thành Success
            payment.Status = "Success";
            payment.PaymentDate = DateTime.UtcNow;
            await _repo.UpdateAsync(payment);

            // Cập nhật rental
            if (!rental.TotalCost.HasValue || rental.TotalCost.Value <= 0)
            {
                rental.TotalCost = amount;
            }
            rental.Status = "PAID";
            await _rentalRepo.UpdateAsync(rental);

            return payment;
        }
    }
}
