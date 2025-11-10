using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Repository.Implementations
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
            await _context.RentalImages.AddAsync(image);
            await _context.SaveChangesAsync();
            return image;
        }

        public async Task AddRangeAsync(IEnumerable<RentalImage> images)
        {
            await _context.RentalImages.AddRangeAsync(images);
            await _context.SaveChangesAsync();
        }

        public async Task<List<RentalImage>> GetByRentalIdAsync(Guid rentalId)
        {
            return await _context.RentalImages
                .AsNoTracking()
                .Where(ri => ri.RentalId == rentalId)
                .ToListAsync();
        }
    }
}