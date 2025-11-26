using Repository.Models;
using Repository.Base;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class DepositRepository : GenericRepository<Deposit>
    {
        public DepositRepository() : base() { }
        public DepositRepository(SWP391RentEVContext context) : base(context) { }

        public async Task AddAsync(Deposit deposit)
        {
            _context.Deposits.Add(deposit);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Deposit deposit)
        {
            _context.Deposits.Update(deposit);
            await _context.SaveChangesAsync();
        }

        public async Task<Deposit?> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.Set<Deposit>()
                .FirstOrDefaultAsync(d => d.RentalId == rentalId);
        }

        public async Task<List<Deposit>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Set<Deposit>()
                .Where(d => d.UserId == userId)
                .ToListAsync();
        }
    }
}

