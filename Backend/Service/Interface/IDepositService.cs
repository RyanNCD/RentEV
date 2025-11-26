using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IDepositService
    {
        Task<Deposit> CreateDepositAsync(Guid rentalId, Guid userId, decimal amount);
        Task<Deposit?> GetDepositByRentalIdAsync(Guid rentalId);
        Task<List<Deposit>> GetDepositsByUserIdAsync(Guid userId);
        Task<Deposit> RefundDepositAsync(Guid depositId, string? reason);
        Task<Deposit> ForfeitDepositAsync(Guid depositId, string reason);
    }
}

