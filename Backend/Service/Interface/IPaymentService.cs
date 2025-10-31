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
        Task<string> CreatePaymentUrlAsync(decimal amount, Guid orderId, string ipAddress);
        Task<bool> HandleVnPayReturnAsync(Dictionary<string, string> queryParams);

    }
}
