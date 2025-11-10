using Microsoft.EntityFrameworkCore;
using Repository.DTO;
using Repository.Models;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class VehicleRepository
    {
        private readonly SWP391RentEVContext _context;
        public VehicleRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Vehicle>> GetVehicleAllAsync()
        {
            return await _context.Vehicles.ToListAsync();
        }
        public async Task<Vehicle?> GetVehicleByIdAsync(Guid id)
        {
            return await _context.Vehicles.FirstOrDefaultAsync(u => u.VehicleId == id);
        }

        public async Task AddVehicelAsync(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
        }

        public async Task<int> UpdateAsync(Vehicle vehicle)
        {
            _context.Vehicles.Update(vehicle);
            return await _context.SaveChangesAsync();
        }


        public async Task DeleteVeicleAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle != null)
            {
                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<VehicleDto>> SearchVehiclesAsync(string keyword)
        {
            var query = _context.Vehicles.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(v =>
                    v.VehicleName.ToLower().Contains(keyword) ||
                    v.VehicleType.ToLower().Contains(keyword) ||
                    v.LicensePlate.ToLower().Contains(keyword));
            }

            return await query
                .Select(v => new VehicleDto
                {
                    VehicleId = v.VehicleId,
                    StationId = v.StationId,
                    VehicleName = v.VehicleName,
                    VehicleType = v.VehicleType,
                    BatteryCapacity = v.BatteryCapacity,
                    LicensePlate = v.LicensePlate,
                    Status = v.Status,
                    PricePerDay = v.PricePerDay,
                    Description = v.Description,
                    SeatingCapacity = v.SeatingCapacity,
                    Utilities = v.Utilities,
                    NumberOfRenters = v.NumberOfRenters
                })
                .ToListAsync();
        }

        // 🎯 FILTER
        public async Task<List<VehicleDto>> FilterVehiclesAsync(Guid? stationId, string status, int? seatingCapacity)
        {
            var query = _context.Vehicles.AsQueryable();

            if (stationId.HasValue)
                query = query.Where(v => v.StationId == stationId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(v => v.Status.ToLower() == status.ToLower());

            if (seatingCapacity.HasValue)
                query = query.Where(v => v.SeatingCapacity == seatingCapacity.Value);

            return await query
                .Select(v => new VehicleDto
                {
                    VehicleId = v.VehicleId,
                    StationId = v.StationId,
                    VehicleName = v.VehicleName,
                    VehicleType = v.VehicleType,
                    BatteryCapacity = v.BatteryCapacity,
                    LicensePlate = v.LicensePlate,
                    Status = v.Status,
                    PricePerDay = v.PricePerDay,
                    Description = v.Description,
                    SeatingCapacity = v.SeatingCapacity,
                    Utilities = v.Utilities,
                    NumberOfRenters = v.NumberOfRenters
                })
                .ToListAsync();
        }

        // ↕️ SORT
        public async Task<List<VehicleDto>> SortVehiclesAsync(string sortBy, bool isDescending)
        {
            var query = _context.Vehicles.AsQueryable();

            query = sortBy?.ToLower() switch
            {
                "name" => isDescending ? query.OrderByDescending(v => v.VehicleName) : query.OrderBy(v => v.VehicleName),
                "price" => isDescending ? query.OrderByDescending(v => v.PricePerDay) : query.OrderBy(v => v.PricePerDay),
                "battery" => isDescending ? query.OrderByDescending(v => v.BatteryCapacity) : query.OrderBy(v => v.BatteryCapacity),
                _ => query.OrderBy(v => v.VehicleName)
            };

            return await query
                .Select(v => new VehicleDto
                {
                    VehicleId = v.VehicleId,
                    StationId = v.StationId,
                    VehicleName = v.VehicleName,
                    VehicleType = v.VehicleType,
                    BatteryCapacity = v.BatteryCapacity,
                    LicensePlate = v.LicensePlate,
                    Status = v.Status,
                    PricePerDay = v.PricePerDay,
                    Description = v.Description,
                    SeatingCapacity = v.SeatingCapacity,
                    Utilities = v.Utilities,
                    NumberOfRenters = v.NumberOfRenters
                })
                .ToListAsync();
        }

        public async Task<List<Vehicle>> GetFeaturedVehiclesAsync(int topCount = 5)
        {
            return await _context.Vehicles
                .OrderByDescending(v => v.NumberOfRenters)
                .Take(topCount)
                .ToListAsync();
        }

    }
}
