using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IRentalService
    {
        Task<IEnumerable<Rental>> GetAllRentalAsync();
        Task<Rental> CreateRentalAsync(Rental rental);
        Task<Rental?> GetRentalByIdAsync(Guid id);
        Task<Rental?> UpdateRentalAsync(Guid id , Rental rental);
        Task<bool> CancelRentalAsync(Guid rentalId);
        Task<IEnumerable<Rental>> GetRentalsByUserAsync(Guid userId);

        // Paid rentals via Payment join
        Task<IEnumerable<Rental>> GetPaidRentalsAsync();
        Task<Rental?> GetPaidRentalByIdAsync(Guid id);
        Task<IEnumerable<Rental>> GetPaidRentalsByUserAsync(Guid userId);

        // Rentals ready for handover (Status=PAID + successful payment)
        Task<IEnumerable<Rental>> GetReadyForHandoverAsync();

        // Staff operations
        Task<Rental?> CheckInAsync(Guid rentalId, Guid staffId, DateTime deliveredAt, string? deliveryCondition);
        Task<Rental?> CheckOutAsync(Guid rentalId, Guid staffId, DateTime receivedAt, string? returnCondition);

        // Pagination and filtering
        Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsPagedAsync(
            int pageNumber = 1,
            int pageSize = 10,
            string? status = null,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            Guid? stationId = null);

        // Get completed rental by user and vehicle (for feedback eligibility)
        Task<Rental?> GetCompletedRentalByUserAndVehicleAsync(Guid userId, Guid vehicleId);

        // Get paid rentals by user with pagination and filtering (for user profile)
        Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsByUserPagedAsync(
            Guid userId,
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null);

    }
}
