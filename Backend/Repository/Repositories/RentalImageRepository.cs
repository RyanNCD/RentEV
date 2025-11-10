using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class RentalImageRepository
    {
        private readonly SWP391RentEVContext _context;

        public RentalImageRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<RentalImage> AddAsync(RentalImage image)
        {
            image.ImageId = Guid.NewGuid();
            image.CreatedAt = DateTime.UtcNow;
            await _context.RentalImages.AddAsync(image);
            await _context.SaveChangesAsync();
            return image;
        }

        public async Task<List<RentalImage>> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.RentalImages
                .Where(img => img.RentalId == rentalId)
                .ToListAsync();
        }

        public async Task<List<RentalImage>> GetByRentalIdAndTypeAsync(Guid rentalId, string type)
        {
            return await _context.RentalImages
                .Where(img => img.RentalId == rentalId && img.Type == type)
                .ToListAsync();
        }

        public async Task<RentalImage?> GetByIdAsync(Guid id)
        {
            return await _context.RentalImages.FindAsync(id);
        }

        public async Task DeleteAsync(Guid id)
        {
            var image = await _context.RentalImages.FindAsync(id);
            if (image != null)
            {
                _context.RentalImages.Remove(image);
                await _context.SaveChangesAsync();
            }
        }
    }
}
