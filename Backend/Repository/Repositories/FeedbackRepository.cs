using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class FeedbackRepository
    {
        private readonly SWP391RentEVContext _context;

        public FeedbackRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Feedback>> GetAllAsync()
        {
            return await _context.Feedbacks
                .Include(f => f.User)
                .Include(f => f.Rental)
                .ToListAsync();
        }

        public async Task<Feedback> GetByIdAsync(Guid id)
        {
            return await _context.Feedbacks
                .Include(f => f.User)
                .Include(f => f.Rental)
                .FirstOrDefaultAsync(f => f.FeedbackId == id);
        }

        public async Task<IEnumerable<Feedback>> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.Feedbacks
                .Where(f => f.RentalId == rentalId)
                .Include(f => f.User)
                .ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Feedbacks
                .Where(f => f.UserId == userId)
                .Include(f => f.Rental)
                .ToListAsync();
        }

        public async Task<Feedback> AddAsync(Feedback feedback)
        {
            feedback.FeedbackId = Guid.NewGuid();
            await _context.Feedbacks.AddAsync(feedback);
            await SaveChangesAsync();
            return feedback;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return false;

            _context.Feedbacks.Remove(feedback);
            await SaveChangesAsync();
            return true;
        }

        public async Task<double> GetAverageRatingByRentalAsync(Guid rentalId)
        {
            var ratings = await _context.Feedbacks
                .Where(f => f.RentalId == rentalId && f.Rating.HasValue)
                .Select(f => f.Rating.Value)
                .ToListAsync();

            return ratings.Count > 0 ? ratings.Average() : 0.0;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
