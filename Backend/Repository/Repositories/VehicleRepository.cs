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
            return await _context.Vehicles
                .Include(v => v.Reservations)
                .Include(v => v.Rentals)
                .ToListAsync();
        }
        public async Task<Vehicle?> GetVehicleByIdAsync(Guid id)
        {
            return await _context.Vehicles
                .Include(v => v.Reservations)
                .Include(v => v.Rentals)
                .Include(v => v.Station)
                .FirstOrDefaultAsync(u => u.VehicleId == id);
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
            var query = _context.Vehicles
                .Include(v => v.Reservations)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(v =>
                    (v.VehicleName != null && v.VehicleName.ToLower().Contains(keyword)) ||
                    (v.VehicleType != null && v.VehicleType.ToLower().Contains(keyword)) ||
                    (v.LicensePlate != null && v.LicensePlate.ToLower().Contains(keyword)));
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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
                })
                .ToListAsync();
        }

        // 🎯 FILTER
        public async Task<List<VehicleDto>> FilterVehiclesAsync(Guid? stationId, string status, int? seatingCapacity)
        {
            var query = _context.Vehicles
                .Include(v => v.Reservations)
                .AsQueryable();

            if (stationId.HasValue)
                query = query.Where(v => v.StationId == stationId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(v => v.Status != null && v.Status.ToLower() == status.ToLower());

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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
                })
                .ToListAsync();
        }

        // ↕️ SORT
        public async Task<List<VehicleDto>> SortVehiclesAsync(string sortBy, bool isDescending)
        {
            var query = _context.Vehicles
                .Include(v => v.Reservations)
                .AsQueryable();

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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
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

        public async Task<List<VehicleDto>> GetAvailableVehiclesAsync(DateTime? startTime = null, DateTime? endTime = null)
        {
            var query = _context.Vehicles
                .Include(v => v.Reservations)
                .Include(v => v.Rentals)
                    .ThenInclude(r => r.Payments)
                .Where(v => v.Status != null && v.Status.ToLower() == "available")
                .AsQueryable();

            // Nếu có tham số thời gian, lọc các xe đã được đặt trong khoảng thời gian đó
            if (startTime.HasValue && endTime.HasValue)
            {
                var vehicleIdsWithConflicts = await _context.Rentals
                    .Include(r => r.Payments)
                    .Where(r => r.StartTime.HasValue
                        && r.EndTime.HasValue
                        // Chỉ kiểm tra các rental chưa completed
                        && (r.Status == null || r.Status.ToUpper() != "COMPLETED")
                        && (
                            // Đã thanh toán (có payment thành công)
                            r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS")
                            ||
                            // Hoặc có status đã thanh toán/đang thuê
                            (r.Status != null && (
                                r.Status.ToUpper() == "PAID" 
                                || r.Status.ToUpper() == "BOOKING" 
                                || r.Status.ToUpper() == "IN_PROGRESS"
                            ))
                        )
                        && (
                            // Kiểm tra overlap thời gian: (newStart < existingEnd && newEnd > existingStart)
                            (startTime.Value < r.EndTime.Value && endTime.Value > r.StartTime.Value)
                        )
                    )
                    .Select(r => r.VehicleId)
                    .Distinct()
                    .ToListAsync();

                // Loại bỏ các xe có conflict
                query = query.Where(v => !vehicleIdsWithConflicts.Contains(v.VehicleId));
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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
                })
                .ToListAsync();
        }

        public async Task<VehicleDto?> GetAvailableVehicleByIdAsync(Guid id)
        {
            return await _context.Vehicles
                .Include(v => v.Reservations)
                .Where(v => v.VehicleId == id && v.Status != null && v.Status.ToLower() == "available")
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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
                })
                .FirstOrDefaultAsync();
        }

        // Get vehicles with pagination and filtering
        public async Task<(IEnumerable<VehicleDto> Items, int TotalCount)> GetVehiclesPagedAsync(
            int pageNumber = 1,
            int pageSize = 10,
            Guid? stationId = null,
            string? status = null,
            string? search = null)
        {
            var query = _context.Vehicles
                .Include(v => v.Reservations)
                .Include(v => v.Rentals)
                .Include(v => v.Station)
                .AsQueryable();

            // Filter by station
            if (stationId.HasValue)
            {
                query = query.Where(v => v.StationId == stationId.Value);
            }

            // Filter by status
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(v => v.Status != null && v.Status.ToLower() == status.ToLower());
            }

            // Search by vehicle name, type, license plate
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(v =>
                    (v.VehicleName != null && v.VehicleName.ToLower().Contains(searchLower)) ||
                    (v.VehicleType != null && v.VehicleType.ToLower().Contains(searchLower)) ||
                    (v.LicensePlate != null && v.LicensePlate.ToLower().Contains(searchLower)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and select
            var items = await query
                .OrderByDescending(v => v.VehicleName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
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
                    NumberOfRenters = v.Reservations.Count,
                    ImageUrl = v.ImageUrl
                })
                .ToListAsync();

            return (items, totalCount);
        }

        // Check if vehicle has active rentals (IN_PROGRESS)
        public async Task<bool> HasActiveRentalsAsync(Guid vehicleId)
        {
            return await _context.Rentals
                .AnyAsync(r => r.VehicleId == vehicleId && 
                              r.Status != null && 
                              r.Status.ToUpper() == "IN_PROGRESS");
        }

        // Update vehicle status based on rentals
        public async Task UpdateVehicleStatusBasedOnRentalsAsync(Guid vehicleId)
        {
            var vehicle = await _context.Vehicles
                .Include(v => v.Rentals)
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

            if (vehicle == null) return;

            // Check if vehicle has active rental (IN_PROGRESS)
            var hasActiveRental = vehicle.Rentals.Any(r => 
                r.Status != null && r.Status.ToUpper() == "IN_PROGRESS");

            // Check if vehicle has reserved rental (PAID or BOOKING)
            var hasReservedRental = vehicle.Rentals.Any(r =>
                r.Status != null && (r.Status.ToUpper() == "PAID" || r.Status.ToUpper() == "BOOKING"));

            // Update status based on rental status
            if (hasActiveRental)
            {
                vehicle.Status = "Rented";
            }
            else if (hasReservedRental)
            {
                vehicle.Status = "Reserved";
            }
            else if (vehicle.Status == null || 
                     (vehicle.Status.ToUpper() != "MAINTENANCE" && vehicle.Status.ToUpper() != "UNAVAILABLE"))
            {
                // Only set to Available if not Maintenance or Unavailable
                vehicle.Status = "Available";
            }

            await _context.SaveChangesAsync();
        }

    }
}
