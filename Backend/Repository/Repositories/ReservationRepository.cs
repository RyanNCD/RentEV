using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class ReservationRepository
    {
        private readonly SWP391RentEVContext _context;

        public ReservationRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Reservation>> GetAllAsync()
        {
            return await _context.Reservations
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.Station)
                .ToListAsync();
        }

        public async Task<Reservation> AddAsync(Reservation reservation)
        {
            reservation.ReservationId = Guid.NewGuid();
            reservation.ReservedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(reservation.Status))
            {
                reservation.Status = "Pending";
            }
            await _context.Reservations.AddAsync(reservation);
            await _context.SaveChangesAsync();
            return reservation;
        }

        public async Task<Reservation?> GetByIdAsync(Guid id)
        {
            return await _context.Reservations
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.Station)
                .FirstOrDefaultAsync(r => r.ReservationId == id);
        }

        public async Task<Reservation> UpdateAsync(Reservation reservation)
        {
            _context.Reservations.Update(reservation);
            await _context.SaveChangesAsync();
            return reservation;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null) return false;

            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Reservation>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Reservations
                .Include(r => r.Vehicle)
                .Include(r => r.Station)
                .Where(r => r.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<Reservation>> GetByVehicleIdAsync(Guid vehicleId)
        {
            return await _context.Reservations
                .Include(r => r.User)
                .Include(r => r.Station)
                .Where(r => r.VehicleId == vehicleId)
                .ToListAsync();
        }
    }
}
