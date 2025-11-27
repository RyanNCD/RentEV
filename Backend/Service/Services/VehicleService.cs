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
    public class VehicleService : IVehicleService
    {
        private readonly VehicleRepository _vehicleRepository;
        public VehicleService(VehicleRepository vehicleRepository)
        {
            _vehicleRepository = vehicleRepository;
        }

        public async Task<Vehicle> CreateVehicleAsync(Vehicle vehicle)
        {
            vehicle.VehicleId = Guid.NewGuid();
            vehicle.NumberOfRenters = 0;
            // Set default status to Available if not provided
            if (string.IsNullOrWhiteSpace(vehicle.Status))
            {
                vehicle.Status = "Available";
            }
            await _vehicleRepository.AddVehicelAsync(vehicle);
            return vehicle;
        }

        public async Task<bool> DeleteViheicleAsync(Guid id)
        {
            var existing = await _vehicleRepository.GetVehicleByIdAsync(id);
            if (existing == null) return false;

            // Check if vehicle has active rentals - cannot delete if rented
            var hasActiveRentals = await _vehicleRepository.HasActiveRentalsAsync(id);
            if (hasActiveRentals)
            {
                throw new InvalidOperationException("Không thể xóa xe đang được thuê.");
            }

            await _vehicleRepository.DeleteVeicleAsync(id);
            return true;
        }

        public async Task<IEnumerable<Vehicle>> GetVehicleAllAsync()
        {
            return await _vehicleRepository.GetVehicleAllAsync();
        }

        public async Task<Vehicle?> GetVehicleByIdAsync(Guid id)
        {
            return await _vehicleRepository.GetVehicleByIdAsync(id);
        }

        public async Task UpdateVehicleAsync(Guid id, Vehicle vehicle)
        {
            if (vehicle == null)
                throw new ArgumentNullException(nameof(vehicle));

            // Lấy dữ liệu hiện có trong DB
            var existingVehicle = await _vehicleRepository.GetVehicleByIdAsync(id);
            if (existingVehicle == null)
                throw new KeyNotFoundException($"Vehicle with ID {id} not found");

            // Check if vehicle has active rentals - cannot update if rented
            var hasActiveRentals = await _vehicleRepository.HasActiveRentalsAsync(id);
            if (hasActiveRentals)
            {
                throw new InvalidOperationException("Không thể cập nhật xe đang được thuê.");
            }

            // Validate status changes
            var currentStatus = existingVehicle.Status?.ToUpper();
            var newStatus = vehicle.Status?.ToUpper();

            // If current status is Available, only allow changing to Maintenance or Unavailable
            if (currentStatus == "AVAILABLE" && newStatus != null && 
                newStatus != "MAINTENANCE" && newStatus != "UNAVAILABLE" && newStatus != "AVAILABLE")
            {
                throw new InvalidOperationException("Xe đang ở trạng thái Có sẵn chỉ có thể cập nhật sang Bảo trì hoặc Không khả dụng.");
            }

            // Cập nhật các trường cho phép sửa (không cập nhật NumberOfRenters - tính từ reservations)
            existingVehicle.VehicleName = vehicle.VehicleName;
            existingVehicle.VehicleType = vehicle.VehicleType;
            existingVehicle.BatteryCapacity = vehicle.BatteryCapacity;
            existingVehicle.Status = vehicle.Status;
            existingVehicle.PricePerDay = vehicle.PricePerDay;
            existingVehicle.LicensePlate = vehicle.LicensePlate;
            existingVehicle.Description = vehicle.Description;
            existingVehicle.SeatingCapacity = vehicle.SeatingCapacity;
            existingVehicle.Utilities = vehicle.Utilities;
            existingVehicle.StationId = vehicle.StationId;
            // NumberOfRenters is calculated from Reservations, so we don't update it manually

            // Cập nhật DB
            await _vehicleRepository.UpdateAsync(existingVehicle);
        }

        public async Task<List<VehicleDto>> SearchVehiclesAsync(string keyword)
        {
            return await _vehicleRepository.SearchVehiclesAsync(keyword);
        }

        public async Task<List<VehicleDto>> FilterVehiclesAsync(Guid? stationId, string status, int? seatingCapacity)
        {
            return await _vehicleRepository.FilterVehiclesAsync(stationId, status, seatingCapacity);
        }

        public async Task<List<VehicleDto>> SortVehiclesAsync(string sortBy, bool isDescending)
        {
            return await _vehicleRepository.SortVehiclesAsync(sortBy, isDescending);
        }
        public async Task<List<Vehicle>> GetFeaturedVehiclesAsync(int topCount = 5)
        {
            return await _vehicleRepository.GetFeaturedVehiclesAsync(topCount);
        }

        public async Task<List<VehicleDto>> GetAvailableVehiclesAsync(DateTime? startTime = null, DateTime? endTime = null)
        {
            return await _vehicleRepository.GetAvailableVehiclesAsync(startTime, endTime);
        }

        public async Task<VehicleDto?> GetAvailableVehicleByIdAsync(Guid id)
        {
            return await _vehicleRepository.GetAvailableVehicleByIdAsync(id);
        }

        public async Task<(IEnumerable<VehicleDto> Items, int TotalCount)> GetVehiclesPagedAsync(
            int pageNumber = 1,
            int pageSize = 10,
            Guid? stationId = null,
            string? status = null,
            string? search = null)
        {
            return await _vehicleRepository.GetVehiclesPagedAsync(pageNumber, pageSize, stationId, status, search);
        }

        public async Task<bool> HasActiveRentalsAsync(Guid vehicleId)
        {
            return await _vehicleRepository.HasActiveRentalsAsync(vehicleId);
        }

        public async Task UpdateVehicleStatusBasedOnRentalsAsync(Guid vehicleId)
        {
            await _vehicleRepository.UpdateVehicleStatusBasedOnRentalsAsync(vehicleId);
        }

    }
}
