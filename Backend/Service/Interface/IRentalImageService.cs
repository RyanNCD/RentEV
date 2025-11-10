using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IRentalImageService
    {
        Task<RentalImage> AddRentalImageAsync(RentalImage image);
        Task<List<RentalImage>> GetImagesByRentalIdAsync(Guid rentalId);
        Task<List<RentalImage>> GetImagesByRentalIdAndTypeAsync(Guid rentalId, string type);
        Task<RentalImage?> GetImageByIdAsync(Guid id);
        Task DeleteImageAsync(Guid id);
    }
}
