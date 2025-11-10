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
        public async Task<IEnumerable<Rental>> GetPaidRentalsAsync()
        {
            return await _rentalRepo.GetAllPaidAsync();
        }
        public async Task<IEnumerable<Rental>> GetReadyForHandoverAsync()
        {
            return await _rentalRepo.GetAllReadyForHandoverAsync();
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
        public async Task<Rental?> GetPaidRentalByIdAsync(Guid id)
        {
            return await _rentalRepo.GetPaidByIdAsync(id);
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

        public async Task<IEnumerable<Rental>> GetRentalsByUserAsync(Guid userId)
        {
            return await _rentalRepo.GetByUserIdAsync(userId);
        }
        public async Task<IEnumerable<Rental>> GetPaidRentalsByUserAsync(Guid userId)
        {
            return await _rentalRepo.GetPaidByUserIdAsync(userId);
        }

        public async Task<Rental?> CheckInAsync(Guid rentalId, Guid staffId, DateTime deliveredAt, string? deliveryCondition)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null) return null;
  

            rental.DeliveredAt = deliveredAt;
            rental.DeliveredByStaffId = staffId;
            rental.DeliveryCondition = deliveryCondition;
            rental.Status = "IN_PROGRESS";

            await _rentalRepo.UpdateAsync(rental);
            return rental;
        }

        public async Task<Rental?> CheckOutAsync(Guid rentalId, Guid staffId, DateTime receivedAt, string? returnCondition)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null) return null;

            // Only allow check-out when rental is in progress
            if (!string.Equals(rental.Status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Rental không ở trạng thái đang thuê, không thể nhận xe.");
            }

            rental.ReceivedAt = receivedAt;
            rental.ReceivedByStaffId = staffId;
            rental.ReturnCondition = returnCondition;
            rental.Status = "COMPLETED";

            await _rentalRepo.UpdateAsync(rental);
            return rental;
        }

    }
}
