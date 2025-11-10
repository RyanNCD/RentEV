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

    }
}
