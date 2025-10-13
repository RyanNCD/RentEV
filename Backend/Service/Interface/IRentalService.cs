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
        Task<Rental> CreateRentalAsync(RentalCreateDto dto);
        Task<Rental?> GetRentalByIdAsync(Guid id);
        Task<Rental?> UpdateRentalAsync(RentalUpdateDto dto);
    }
}
