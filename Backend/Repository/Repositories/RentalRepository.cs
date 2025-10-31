using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Implementations
{
    public class RentalRepository 
    {
        private readonly SWP391RentEVContext _context;

        public RentalRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Rental>> GetAllAsync()
        {
            return await _context.Rentals.ToListAsync();
        }

        public async Task<Rental> AddAsync(Rental rental)
        {
            await _context.Rentals.AddAsync(rental);
            await _context.SaveChangesAsync();
            return rental;
        }

        public async Task<Rental?> GetByIdAsync(Guid id)
        {
            return await _context.Rentals
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .FirstOrDefaultAsync(r => r.RentalId == id);
        }

        public async Task<Rental> UpdateAsync(Rental rental)
        {
            _context.Rentals.Update(rental);
            await _context.SaveChangesAsync();
            return rental;

        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> CancelRentalAsync(Guid rentalId)
        {
            var rental = await _context.Rentals.FindAsync(rentalId);
            if (rental == null) return false;

            rental.Status = "Cancelled";
            rental.CreatedAt = DateTime.UtcNow;

            _context.Rentals.Update(rental);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}   