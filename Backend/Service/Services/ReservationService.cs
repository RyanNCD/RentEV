using Repository.DTO;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Service.Services
{
    public class ReservationService : IReservationService
    {
        private readonly ReservationRepository _reservationRepo;
        private readonly VehicleRepository _vehicleRepo;

        public ReservationService(ReservationRepository reservationRepo, VehicleRepository vehicleRepo)
        {
            _reservationRepo = reservationRepo;
            _vehicleRepo = vehicleRepo;
        }

        public async Task<IEnumerable<Reservation>> GetAllReservationsAsync()
        {
            return await _reservationRepo.GetAllAsync();
        }

        public async Task<Reservation> CreateReservationAsync(Reservation reservation)
        {
            // Tự động tăng số người đã thuê xe khi tạo reservation
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(reservation.VehicleId);
            if (vehicle != null)
            {
                vehicle.NumberOfRenters += 1;
                await _vehicleRepo.UpdateAsync(vehicle);
            }

            return await _reservationRepo.AddAsync(reservation);
        }

        public async Task<Reservation?> GetReservationByIdAsync(Guid id)
        {
            return await _reservationRepo.GetByIdAsync(id);
        }

        public async Task<Reservation?> UpdateReservationAsync(Guid id, Reservation reservation)
        {
            if (reservation == null)
                throw new ArgumentNullException(nameof(reservation));

            var existingReservation = await _reservationRepo.GetByIdAsync(id);
            if (existingReservation == null)
                throw new KeyNotFoundException($"Reservation with ID {id} not found");

            existingReservation.UserId = reservation.UserId;
            existingReservation.VehicleId = reservation.VehicleId;
            existingReservation.StationId = reservation.StationId;
            existingReservation.StartDate = reservation.StartDate;
            existingReservation.EndDate = reservation.EndDate;
            existingReservation.Status = reservation.Status;

            return await _reservationRepo.UpdateAsync(existingReservation);
        }

        public async Task<bool> DeleteReservationAsync(Guid id)
        {
            return await _reservationRepo.DeleteAsync(id);
        }

        public async Task<List<Reservation>> GetReservationsByUserIdAsync(Guid userId)
        {
            return await _reservationRepo.GetByUserIdAsync(userId);
        }

        public async Task<List<Reservation>> GetReservationsByVehicleIdAsync(Guid vehicleId)
        {
            return await _reservationRepo.GetByVehicleIdAsync(vehicleId);
        }
    }
}
