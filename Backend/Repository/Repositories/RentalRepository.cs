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

        // Rentals that have at least one successful payment (Status = "Success")
        public async Task<IEnumerable<Rental>> GetAllPaidAsync()
        {
            return await _context.Rentals
                                 .Where(r => r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
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

        public async Task<Rental?> GetPaidByIdAsync(Guid id)
        {
            return await _context.Rentals
                                 .Where(r => r.RentalId == id && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .FirstOrDefaultAsync();
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

        public async Task<IEnumerable<Rental>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Rentals
                                 .Where(r => r.UserId == userId)
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<Rental>> GetPaidByUserIdAsync(Guid userId)
        {
            return await _context.Rentals
                                 .Where(r => r.UserId == userId && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        // Rentals ready for handover: have successful payment and current status is PAID
        public async Task<IEnumerable<Rental>> GetAllReadyForHandoverAsync()
        {
            return await _context.Rentals
                                 .Where(r => r.Status != null && r.Status.ToUpper() == "PAID"
                                          && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

    }
}   