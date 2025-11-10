using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Services
{
    public class RentalImageService : IRentalImageService
    {
        private readonly RentalImageRepository _imageRepo;

        public RentalImageService(RentalImageRepository imageRepo)
        {
            _imageRepo = imageRepo;
        }

        public async Task<RentalImage> AddRentalImageAsync(RentalImage image)
        {
            return await _imageRepo.AddAsync(image);
        }

        public async Task<List<RentalImage>> GetImagesByRentalIdAsync(Guid rentalId)
        {
            return await _imageRepo.GetByRentalIdAsync(rentalId);
        }

        public async Task<List<RentalImage>> GetImagesByRentalIdAndTypeAsync(Guid rentalId, string type)
        {
            return await _imageRepo.GetByRentalIdAndTypeAsync(rentalId, type);
        }

        public async Task<RentalImage?> GetImageByIdAsync(Guid id)
        {
            return await _imageRepo.GetByIdAsync(id);
        }

        public async Task DeleteImageAsync(Guid id)
        {
            await _imageRepo.DeleteAsync(id);
        }
    }
}
