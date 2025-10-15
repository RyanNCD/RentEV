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
    public class VehicleService : IVehivleService
    {
        private readonly VehicleRepository _vehicleRepository;
        public VehicleService(VehicleRepository vehicleRepository)
        {
            _vehicleRepository = vehicleRepository;
        }

        public async Task<Vehicle> CreateVehicleAsync(Vehicle vehicle)
        {
            vehicle.VehicleId = Guid.NewGuid();
            await _vehicleRepository.AddVehicelAsync(vehicle);
            return vehicle;
        }

        public async Task<bool> DeleteViheicleAsync(Guid id)
        {
            var existing = await _vehicleRepository.GetVehicleByIdAsync(id);
            if (existing == null) return false;

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

            // Cập nhật các trường cho phép sửa
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

            // Cập nhật DB
            await _vehicleRepository.UpdateAsync(existingVehicle);
        }
    }
}
