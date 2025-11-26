using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Repository.Implementations;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Services
{
    public class RentalPenaltyService : IRentalPenaltyService
    {
        private readonly RentalPenaltyRepository _penaltyRepo;
        private readonly RentalRepository _rentalRepo;
        private readonly DepositRepository _depositRepo;

        public RentalPenaltyService(RentalPenaltyRepository penaltyRepo,
                                    RentalRepository rentalRepo,
                                    DepositRepository depositRepo)
        {
            _penaltyRepo = penaltyRepo;
            _rentalRepo = rentalRepo;
            _depositRepo = depositRepo;
        }

        public async Task<RentalPenalty> CreatePenaltyAsync(Guid rentalId, CreateRentalPenaltyDto dto, bool useDepositFirst = true)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId)
                ?? throw new KeyNotFoundException("Rental not found.");

            var penalty = new RentalPenalty
            {
                RentalId = rentalId,
                PenaltyId = dto.PenaltyId,
                Amount = dto.Amount,
                Description = dto.Description ?? $"Penalty for rental {rentalId}",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            if (useDepositFirst && dto.Amount > 0)
            {
                var used = await ApplyDepositOffsetAsync(rentalId, penalty, dto.Amount);
                if (used >= penalty.Amount)
                {
                    penalty.Status = "OffsetFromDeposit";
                    penalty.PaidAt = DateTime.UtcNow;
                }
            }

            return await _penaltyRepo.AddAsync(penalty);
        }

        public async Task<RentalPenalty> SettlePenaltyAsync(Guid rentalPenaltyId, SettleRentalPenaltyDto dto)
        {
            var penalty = await _penaltyRepo.GetByIdAsync(rentalPenaltyId)
                ?? throw new KeyNotFoundException("Rental penalty not found.");

            if (penalty.Status == "Settled")
            {
                return penalty;
            }

            var remaining = penalty.Amount - (penalty.PaidAmount + penalty.DepositUsedAmount);

            if (dto.UseDeposit && remaining > 0)
            {
                await ApplyDepositOffsetAsync(penalty.RentalId, penalty, remaining);
            }

            if (dto.PaymentAmount > 0)
            {
                penalty.PaidAmount += dto.PaymentAmount;
                penalty.PaymentMethod = dto.PaymentMethod;
            }

            if (penalty.PaidAmount + penalty.DepositUsedAmount >= penalty.Amount)
            {
                penalty.Status = dto.UseDeposit && penalty.DepositUsedAmount >= penalty.Amount
                    ? "OffsetFromDeposit"
                    : "Settled";
                penalty.PaidAt = DateTime.UtcNow;
            }

            await _penaltyRepo.UpdateAsync(penalty);
            return penalty;
        }

        public async Task<IEnumerable<RentalPenalty>> GetPenaltiesByRentalAsync(Guid rentalId)
        {
            return await _penaltyRepo.GetByRentalIdAsync(rentalId);
        }

        private async Task<decimal> ApplyDepositOffsetAsync(Guid rentalId, RentalPenalty penalty, decimal requestedAmount)
        {
            var deposit = await _depositRepo.GetByRentalIdAsync(rentalId);
            if (deposit == null || deposit.Amount <= 0)
            {
                return 0m;
            }

            var available = deposit.Amount - deposit.UsedAmount;
            if (available <= 0)
            {
                return 0m;
            }

            var amountToUse = Math.Min(requestedAmount, available);
            deposit.UsedAmount += amountToUse;
            deposit.LastUsedAt = DateTime.UtcNow;

            penalty.DepositUsedAmount += amountToUse;
            penalty.PaymentMethod = "Deposit";

            await _depositRepo.UpdateAsync(deposit);
            return amountToUse;
        }
    }
}

