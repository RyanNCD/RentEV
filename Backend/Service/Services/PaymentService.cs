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
        public async Task<string> CreatePaymentUrlAsync(decimal amount, Guid orderId, string ipAddress)
        {
            // Ensure TxnRef is non-empty
            if (orderId == Guid.Empty)
            {
                orderId = Guid.NewGuid();
            }

            var requestData = new Dictionary<string, string>
            {
                {"vnp_Version", "2.1.0"},
                {"vnp_Command", "pay"},
                {"vnp_TmnCode", _config.TmnCode},
                {"vnp_Amount", (amount * 100).ToString("0", System.Globalization.CultureInfo.InvariantCulture)},
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

        // Implement HandleVnPayReturnAsync
        public async Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams)
        {
            return await Task.FromResult(VnPayHelper.ValidateReturn(queryParams, _config.HashSecret));
        }
    }
}
