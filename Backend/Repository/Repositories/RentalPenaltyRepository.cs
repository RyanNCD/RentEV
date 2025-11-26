using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class RentalPenaltyRepository
    {
        private readonly SWP391RentEVContext _context;

        public RentalPenaltyRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<RentalPenalty> AddAsync(RentalPenalty penalty)
        {
            _context.RentalPenalties.Add(penalty);
            await _context.SaveChangesAsync();
            return penalty;
        }

        public async Task<RentalPenalty?> GetByIdAsync(Guid id)
        {
            return await _context.RentalPenalties
                .Include(rp => rp.Penalty)
                .Include(rp => rp.Rental)
                .FirstOrDefaultAsync(rp => rp.RentalPenaltyId == id);
        }

        public async Task<List<RentalPenalty>> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.RentalPenalties
                .Include(rp => rp.Penalty)
                .Where(rp => rp.RentalId == rentalId)
                .OrderByDescending(rp => rp.CreatedAt)
                .ToListAsync();
        }

        public async Task UpdateAsync(RentalPenalty penalty)
        {
            _context.RentalPenalties.Update(penalty);
            await _context.SaveChangesAsync();
        }
    }
}

