using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IReservationService
    {
        Task<IEnumerable<Reservation>> GetAllReservationsAsync();
        Task<Reservation> CreateReservationAsync(Reservation reservation);
        Task<Reservation?> GetReservationByIdAsync(Guid id);
        Task<Reservation?> UpdateReservationAsync(Guid id, Reservation reservation);
        Task<bool> DeleteReservationAsync(Guid id);
        Task<List<Reservation>> GetReservationsByUserIdAsync(Guid userId);
        Task<List<Reservation>> GetReservationsByVehicleIdAsync(Guid vehicleId);
    }
}
