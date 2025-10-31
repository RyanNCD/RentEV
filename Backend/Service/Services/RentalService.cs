using Repository.DTO;
using Repository.Implementations;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Services
{
    public class RentalService : IRentalService
    {
        private readonly RentalRepository _rentalRepo;
        private readonly VehicleRepository _vehicleRepo;
     

        public RentalService(RentalRepository rentalRepo, VehicleRepository vehicleRepo)
        {
            _rentalRepo = rentalRepo;
            _vehicleRepo = vehicleRepo;
        }

        public async Task<IEnumerable<Rental>> GetAllRentalAsync()
        {
            return await _rentalRepo.GetAllAsync();
        }
        public async Task<Rental> CreateRentalAsync(Rental rental)
        {
            rental.RentalId = Guid.NewGuid();
            rental.CreatedAt = DateTime.UtcNow;

            await _rentalRepo.AddAsync(rental);

            // Cập nhật số người đã thuê xe
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
            if (vehicle != null)
            {
                vehicle.NumberOfRenters += 1;
                await _vehicleRepo.UpdateAsync(vehicle);
            }

            return rental;
        }


        public async Task<Rental?> UpdateRentalAsync(Guid id, Rental rental)
        {
            if (rental == null)
                throw new ArgumentNullException(nameof(rental));

            // Lấy dữ liệu hiện có trong DB
            var existingRental = await _rentalRepo.GetByIdAsync(id);
            if (existingRental == null)
                throw new KeyNotFoundException($"Rental with ID {id} not found");

            // Cập nhật các trường cho phép sửa
            existingRental.ContractId = rental.ContractId;
            existingRental.UserId = rental.UserId;
            existingRental.VehicleId = rental.VehicleId;
            existingRental.PickupStationId = rental.PickupStationId;
            existingRental.ReturnStationId = rental.ReturnStationId;
            existingRental.StaffId = rental.StaffId;
            existingRental.StartTime = rental.StartTime;
            existingRental.EndTime = rental.EndTime;
            existingRental.TotalCost = rental.TotalCost;
            existingRental.Status = rental.Status;

            await _rentalRepo.UpdateAsync(existingRental);
            return existingRental;
        }



        public async Task<Rental?> GetRentalByIdAsync(Guid id)
        {
            return await _rentalRepo.GetByIdAsync(id);
        }

        public async Task<bool> CancelRentalAsync(Guid rentalId)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
                throw new KeyNotFoundException($"Rental with ID {rentalId} not found.");

            if (rental.Status == "Cancelled")
                throw new InvalidOperationException("This rental has already been cancelled.");

            // Cập nhật trạng thái thuê
            var result = await _rentalRepo.CancelRentalAsync(rentalId);

            // Cập nhật lại trạng thái xe (nếu xe đang bị giữ)
            if (result)
            {
                var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
                if (vehicle != null)
                {
                    vehicle.Status = "Available";
                    await _vehicleRepo.UpdateAsync(vehicle);
                }
            }

            return result;
        }

    }
}
