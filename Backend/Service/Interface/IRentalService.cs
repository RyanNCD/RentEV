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

    }
}
