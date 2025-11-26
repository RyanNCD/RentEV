using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class ContractRepository
    {
        private readonly SWP391RentEVContext _context;

        public ContractRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<Contract?> GetContractByIdAsync(Guid id)
        {
            return await _context.Contracts
                .Include(c => c.Vehicle)
                .FirstOrDefaultAsync(u => u.ContractId == id);
        }

        public async Task<IEnumerable<Contract>> GetContractAllAsync()
        {
            return await _context.Contracts
                .Include(c => c.Vehicle)
                .ToListAsync();
        }

        public async Task AddContractlAsync(Contract contract)
        {
            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();
        }

        public async Task<int> UpdateAsync(Contract contract)
        {
            _context.Contracts.Update(contract);
            return await _context.SaveChangesAsync();
        }


        public async Task DeleteAsync(Guid id)
        {
            var contract = await _context.Contracts.FindAsync(id);
            if (contract != null)
            {
                _context.Contracts.Remove(contract);
                await _context.SaveChangesAsync();
            }
        }

    }
}
