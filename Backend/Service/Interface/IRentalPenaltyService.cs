using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IRentalPenaltyService
    {
        Task<RentalPenalty> CreatePenaltyAsync(Guid rentalId, CreateRentalPenaltyDto dto, bool useDepositFirst = true);
        Task<RentalPenalty> SettlePenaltyAsync(Guid rentalPenaltyId, SettleRentalPenaltyDto dto);
        Task<IEnumerable<RentalPenalty>> GetPenaltiesByRentalAsync(Guid rentalId);
    }
}

