using Repository.Implementations;
using Repository.Models;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Services
{
    public class RentalImageService : IRentalImageService
    {
        private readonly RentalImageRepository _repo;

        public RentalImageService(RentalImageRepository repo)
        {
            _repo = repo;
        }

        public Task<RentalImage> AddAsync(RentalImage image) => _repo.AddAsync(image);
        public Task AddRangeAsync(IEnumerable<RentalImage> images) => _repo.AddRangeAsync(images);
        public Task<List<RentalImage>> GetByRentalIdAsync(Guid rentalId) => _repo.GetByRentalIdAsync(rentalId);
    }
}