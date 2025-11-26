using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Services
{
    public class DepositService : IDepositService
    {
        private readonly DepositRepository _depositRepo;

        public DepositService(DepositRepository depositRepo)
        {
            _depositRepo = depositRepo;
        }

        public async Task<Deposit> CreateDepositAsync(Guid rentalId, Guid userId, decimal amount)
        {
            var deposit = new Deposit
            {
                DepositId = Guid.NewGuid(),
                RentalId = rentalId,
                UserId = userId,
                Amount = amount,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _depositRepo.AddAsync(deposit);
            return deposit;
        }

        public async Task<Deposit?> GetDepositByRentalIdAsync(Guid rentalId)
        {
            return await _depositRepo.GetByRentalIdAsync(rentalId);
        }

        public async Task<List<Deposit>> GetDepositsByUserIdAsync(Guid userId)
        {
            return await _depositRepo.GetByUserIdAsync(userId);
        }

        public async Task<Deposit> RefundDepositAsync(Guid depositId, string? reason)
        {
            var deposit = await _depositRepo.GetByIdAsync(depositId);
            if (deposit == null)
            {
                throw new KeyNotFoundException("Deposit not found.");
            }

            deposit.Status = "Refunded";
            deposit.RefundDate = DateTime.UtcNow;
            deposit.RefundReason = reason;

            await _depositRepo.UpdateAsync(deposit);
            return deposit;
        }

        public async Task<Deposit> ForfeitDepositAsync(Guid depositId, string reason)
        {
            var deposit = await _depositRepo.GetByIdAsync(depositId);
            if (deposit == null)
            {
                throw new KeyNotFoundException("Deposit not found.");
            }

            deposit.Status = "Forfeited";
            deposit.RefundReason = reason;

            await _depositRepo.UpdateAsync(deposit);
            return deposit;
        }
    }
}

