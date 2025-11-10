using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class PaymentRepository
    {
        private readonly SWP391RentEVContext _context;

        public PaymentRepository(SWP391RentEVContext context)
        {
            _context = context;
        }
        public async Task AddAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<Payment> GetByIdAsync(Guid id)
        {
            return await _context.Payments
                .Include(p => p.User)
                .Include(p => p.Rental)
                .FirstOrDefaultAsync(p => p.PaymentId == id);
        }

        public async Task<List<Payment>> GetAllAsync()
        {
            return await _context.Payments
                .Include(p => p.User)
                .Include(p => p.Rental)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task UpdateAsync(Payment payment)
        {
            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<Payment?> GetByTransactionIdAsync(string transactionId)
        {
            return await _context.Payments
                .Include(p => p.Rental)
                .FirstOrDefaultAsync(p => p.TransactionId == transactionId);
        }

        // Return all payments associated with a rental
        public async Task<List<Payment>> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.Payments
                .Where(p => p.RentalId == rentalId)
                .Include(p => p.User)
                .Include(p => p.Rental)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        // Efficient existence check for successful payment of a rental
        public async Task<bool> HasSuccessfulPaymentAsync(Guid rentalId)
        {
            return await _context.Payments
                .AnyAsync(p => p.RentalId == rentalId && p.Status != null && p.Status.ToUpper() == "SUCCESS");
        }
    }
}
