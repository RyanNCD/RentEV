using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IRentalImageService
    {
        Task<RentalImage> AddAsync(RentalImage image);
        Task AddRangeAsync(IEnumerable<RentalImage> images);
        Task<List<RentalImage>> GetByRentalIdAsync(Guid rentalId);
    }
}