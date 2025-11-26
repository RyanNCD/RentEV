using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Repository.Implementations;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Service.Services
{
    public class RentalPenaltyService : IRentalPenaltyService
    {
        private readonly RentalPenaltyRepository _penaltyRepo;
        private readonly RentalRepository _rentalRepo;
        private readonly DepositRepository _depositRepo;
        private readonly SWP391RentEVContext _context;

        public RentalPenaltyService(RentalPenaltyRepository penaltyRepo,
                                    RentalRepository rentalRepo,
                                    DepositRepository depositRepo,
                                    SWP391RentEVContext context)
        {
            _penaltyRepo = penaltyRepo;
            _rentalRepo = rentalRepo;
            _depositRepo = depositRepo;
            _context = context;
        }

        public async Task<RentalPenalty> CreatePenaltyAsync(Guid rentalId, CreateRentalPenaltyDto dto, bool useDepositFirst = true)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId)
                ?? throw new KeyNotFoundException("Rental not found.");

            // Kiểm tra nếu penalty liên quan đến "Trả xe trước thời hạn" thì cần có yêu cầu từ khách hàng
            var penaltyCatalog = await _context.Penalties.FindAsync(dto.PenaltyId);
            if (penaltyCatalog != null)
            {
                // Kiểm tra nếu violationType liên quan đến "EarlyReturn" hoặc "Trả xe trước"
                var violationType = penaltyCatalog.ViolationType?.ToLower() ?? "";
                if (violationType.Contains("early") || violationType.Contains("trả xe trước") || violationType == "earlyreturn")
                {
                    if (!rental.EarlyReturnRequested)
                    {
                        throw new InvalidOperationException("⚠️ Trả xe trước thời hạn: Cần có yêu cầu từ khách hàng trước khi nhận xe.");
                    }
                }
            }

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

        public async Task<bool> DeletePenaltyAsync(Guid rentalPenaltyId)
        {
            var penalty = await _penaltyRepo.GetByIdAsync(rentalPenaltyId);
            if (penalty == null)
            {
                return false;
            }

            // Cho phép xóa nếu penalty chưa được settle hoàn toàn (Pending hoặc OffsetFromDeposit)
            // Không cho phép xóa nếu đã Settled (đã thu tiền)
            if (penalty.Status == "Settled")
            {
                throw new InvalidOperationException("Không thể xóa khoản phạt đã được thanh toán hoàn toàn.");
            }

            // Nếu đã trừ cọc, cần hoàn lại tiền cọc
            if (penalty.DepositUsedAmount > 0)
            {
                var deposit = await _depositRepo.GetByRentalIdAsync(penalty.RentalId);
                if (deposit != null)
                {
                    deposit.UsedAmount = Math.Max(0, deposit.UsedAmount - penalty.DepositUsedAmount);
                    deposit.LastUsedAt = DateTime.UtcNow;
                    await _depositRepo.UpdateAsync(deposit);
                }
            }

            await _penaltyRepo.DeleteAsync(penalty);
            return true;
        }

        public async Task<RentalPenalty> UpdatePenaltyAsync(Guid rentalPenaltyId, UpdateRentalPenaltyDto dto)
        {
            var penalty = await _penaltyRepo.GetByIdAsync(rentalPenaltyId)
                ?? throw new KeyNotFoundException("Rental penalty not found.");

            // Chỉ cho phép sửa nếu penalty chưa được settle hoàn toàn
            if (penalty.Status == "Settled")
            {
                throw new InvalidOperationException("Không thể sửa khoản phạt đã được thanh toán hoàn toàn.");
            }

            // Nếu đã trừ cọc và số tiền mới nhỏ hơn số tiền đã trừ, cần điều chỉnh lại
            if (penalty.DepositUsedAmount > 0 && dto.Amount < penalty.DepositUsedAmount)
            {
                // Hoàn lại phần cọc thừa
                var excessDeposit = penalty.DepositUsedAmount - dto.Amount;
                var deposit = await _depositRepo.GetByRentalIdAsync(penalty.RentalId);
                if (deposit != null)
                {
                    deposit.UsedAmount = Math.Max(0, deposit.UsedAmount - excessDeposit);
                    deposit.LastUsedAt = DateTime.UtcNow;
                    await _depositRepo.UpdateAsync(deposit);
                }
                penalty.DepositUsedAmount = dto.Amount;
            }
            // Nếu số tiền mới lớn hơn số tiền đã trừ và đã trừ hết, cần cập nhật lại status
            else if (penalty.DepositUsedAmount > 0 && dto.Amount > penalty.DepositUsedAmount)
            {
                // Nếu trước đó đã trừ hết (OffsetFromDeposit) nhưng số tiền mới lớn hơn, chuyển về Pending
                if (penalty.Status == "OffsetFromDeposit" && dto.Amount > penalty.DepositUsedAmount)
                {
                    penalty.Status = "Pending";
                    penalty.PaidAt = null;
                }
            }

            penalty.Amount = dto.Amount;
            if (!string.IsNullOrWhiteSpace(dto.Description))
            {
                penalty.Description = dto.Description;
            }

            // Cập nhật lại status nếu cần
            var totalPaid = penalty.PaidAmount + penalty.DepositUsedAmount;
            if (totalPaid >= penalty.Amount && penalty.Status != "Settled")
            {
                penalty.Status = penalty.DepositUsedAmount >= penalty.Amount
                    ? "OffsetFromDeposit"
                    : "Settled";
                if (penalty.Status != "Pending")
                {
                    penalty.PaidAt = DateTime.UtcNow;
                }
            }
            else if (totalPaid < penalty.Amount && penalty.Status != "Pending")
            {
                penalty.Status = "Pending";
                penalty.PaidAt = null;
            }

            await _penaltyRepo.UpdateAsync(penalty);
            return penalty;
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

