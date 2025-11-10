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
        private readonly IRentalImageService _imageService;
     

        public RentalService(RentalRepository rentalRepo, VehicleRepository vehicleRepo, IRentalImageService imageService)
        {
            _rentalRepo = rentalRepo;
            _vehicleRepo = vehicleRepo;
            _imageService = imageService;
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

            // Số người đã thuê xe sẽ được tăng khi tạo reservation, không tăng ở đây

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

        public async Task<Rental?> CheckinRentalAsync(Guid rentalId, Guid staffId, VehicleConditionCheckDto conditionCheck)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
                throw new KeyNotFoundException($"Rental with ID {rentalId} not found.");

            if (rental.Status != "Pending" && rental.Status != "Confirmed")
                throw new InvalidOperationException($"Cannot checkin rental with status: {rental.Status}");

            // Cập nhật thông tin checkin
            rental.Status = "Active";
            rental.StartTime = DateTime.UtcNow;
            rental.StaffId = staffId;

            // Lưu hình ảnh và ghi chú tình trạng xe khi giao
            if (conditionCheck != null && conditionCheck.ImageUrls != null && conditionCheck.ImageUrls.Any())
            {
                foreach (var imageUrl in conditionCheck.ImageUrls)
                {
                    var rentalImage = new RentalImage
                    {
                        RentalId = rentalId,
                        ImageUrl = imageUrl,
                        Type = "Pickup",
                        Description = conditionCheck.Description ?? "Vehicle condition at pickup",
                        Note = conditionCheck.Note ?? ""
                    };
                    await _imageService.AddRentalImageAsync(rentalImage);
                }
            }

            // Cập nhật trạng thái xe
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
            if (vehicle != null)
            {
                vehicle.Status = "Rented";
                await _vehicleRepo.UpdateAsync(vehicle);
            }

            await _rentalRepo.UpdateAsync(rental);
            return rental;
        }

        public async Task<Rental?> ReturnRentalAsync(Guid rentalId, Guid staffId, VehicleConditionCheckDto conditionCheck)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
                throw new KeyNotFoundException($"Rental with ID {rentalId} not found.");

            if (rental.Status != "Active")
                throw new InvalidOperationException($"Cannot return rental with status: {rental.Status}. Rental must be Active.");

            // Bắt buộc phải có kiểm tra tình trạng xe khi trả
            if (conditionCheck == null || conditionCheck.ImageUrls == null || !conditionCheck.ImageUrls.Any())
                throw new InvalidOperationException("Vehicle condition check is required before accepting return. Please provide images and notes.");

            // Cập nhật thông tin return
            rental.Status = "Completed";
            rental.EndTime = DateTime.UtcNow;
            if (rental.StaffId == null)
            {
                rental.StaffId = staffId;
            }

            // Lưu hình ảnh và ghi chú tình trạng xe khi trả
            foreach (var imageUrl in conditionCheck.ImageUrls)
            {
                var rentalImage = new RentalImage
                {
                    RentalId = rentalId,
                    ImageUrl = imageUrl,
                    Type = "Return",
                    Description = conditionCheck.Description ?? "Vehicle condition at return",
                    Note = conditionCheck.Note ?? ""
                };
                await _imageService.AddRentalImageAsync(rentalImage);
            }

            // Cập nhật trạng thái xe
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
            if (vehicle != null)
            {
                vehicle.Status = "Available";
                await _vehicleRepo.UpdateAsync(vehicle);
            }

            await _rentalRepo.UpdateAsync(rental);
            return rental;
        }

    }
}
