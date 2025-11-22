using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Implementations
{
    public class RentalRepository 
    {
        private readonly SWP391RentEVContext _context;

        public RentalRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Rental>> GetAllAsync()
        {
            return await _context.Rentals
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.PickupStation)
                .Include(r => r.ReturnStation)
                .Include(r => r.Contract)
                .ToListAsync();
        }

        // Rentals that have at least one successful payment (Status = "Success")
        public async Task<IEnumerable<Rental>> GetAllPaidAsync()
        {
            return await _context.Rentals
                                 .Where(r => r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.Contract)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<Rental> AddAsync(Rental rental)
        {
            await _context.Rentals.AddAsync(rental);
            await _context.SaveChangesAsync();
            return rental;
        }

        public async Task<Rental?> GetByIdAsync(Guid id)
        {
            return await _context.Rentals
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.PickupStation)
                                 .Include(r => r.ReturnStation)
                                 .Include(r => r.RentalImages)
                                 .Include(r => r.Contract)
                                 .FirstOrDefaultAsync(r => r.RentalId == id);
        }

        public async Task<Rental?> GetPaidByIdAsync(Guid id)
        {
            return await _context.Rentals
                                 .Where(r => r.RentalId == id && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.PickupStation)
                                 .Include(r => r.ReturnStation)
                                 .Include(r => r.Contract)
                                 .FirstOrDefaultAsync();
        }

        public async Task<Rental> UpdateAsync(Rental rental)
        {
            _context.Rentals.Update(rental);
            await _context.SaveChangesAsync();
            return rental;

        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> CancelRentalAsync(Guid rentalId)
        {
            var rental = await _context.Rentals.FindAsync(rentalId);
            if (rental == null) return false;

            rental.Status = "Cancelled";
            rental.CreatedAt = DateTime.UtcNow;

            _context.Rentals.Update(rental);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Rental>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Rentals
                                 .Where(r => r.UserId == userId)
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.Contract)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<Rental>> GetPaidByUserIdAsync(Guid userId)
        {
            return await _context.Rentals
                                 .Where(r => r.UserId == userId && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.Contract)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<Rental?> GetCompletedRentalByUserAndVehicleAsync(Guid userId, Guid vehicleId)
        {
            return await _context.Rentals
                                 .Where(r => r.UserId == userId 
                                          && r.VehicleId == vehicleId
                                          && r.Status != null 
                                          && r.Status.ToUpper() == "COMPLETED"
                                          && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .FirstOrDefaultAsync();
        }

        // Rentals ready for handover: have successful payment and current status is PAID
        public async Task<IEnumerable<Rental>> GetAllReadyForHandoverAsync()
        {
            return await _context.Rentals
                                 .Where(r => r.Status != null && r.Status.ToUpper() == "PAID"
                                          && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                 .Include(r => r.Vehicle)
                                 .Include(r => r.User)
                                 .Include(r => r.Contract)
                                 .OrderByDescending(r => r.CreatedAt)
                                 .ToListAsync();
        }

        // Get paid rentals with pagination and filtering
        public async Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsPagedAsync(
            int pageNumber = 1,
            int pageSize = 10,
            string? status = null,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            Guid? stationId = null)
        {
            var query = _context.Rentals
                .Where(r => r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.PickupStation)
                .Include(r => r.ReturnStation)
                .Include(r => r.Contract)
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status != null && r.Status.ToUpper() == status.ToUpper());
            }

            // Search by vehicle name, user name, or rental ID
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(r =>
                    (r.Vehicle != null && r.Vehicle.VehicleName != null && r.Vehicle.VehicleName.ToLower().Contains(searchLower)) ||
                    (r.User != null && r.User.FullName != null && r.User.FullName.ToLower().Contains(searchLower)) ||
                    r.RentalId.ToString().ToLower().Contains(searchLower));
            }

            // Filter by date range (start time)
            if (startDate.HasValue)
            {
                query = query.Where(r => r.StartTime >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(r => r.StartTime <= endDate.Value);
            }

            // Filter by station (pickup or return station)
            if (stationId.HasValue)
            {
                query = query.Where(r => r.PickupStationId == stationId.Value || (r.ReturnStationId.HasValue && r.ReturnStationId.Value == stationId.Value));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        // Get paid rentals by user with pagination and filtering
        public async Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsByUserPagedAsync(
            Guid userId,
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _context.Rentals
                .Where(r => r.UserId == userId 
                         && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.PickupStation)
                .Include(r => r.ReturnStation)
                .Include(r => r.Contract)
                .AsQueryable();

            // Search by vehicle name or rental ID
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(r =>
                    (r.Vehicle != null && r.Vehicle.VehicleName != null && r.Vehicle.VehicleName.ToLower().Contains(searchLower)) ||
                    r.RentalId.ToString().ToLower().Contains(searchLower));
            }

            // Filter by date range (start time)
            if (startDate.HasValue)
            {
                query = query.Where(r => r.StartTime >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(r => r.StartTime <= endDate.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

    }
}   