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
        Task<string> CreatePaymentUrlAsync(Payment payment, string ipAddress);
        Task<Payment> ProcessVnPayReturnAsync(Dictionary<string, string> queryParams);
        Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams);
    }
}
