using Repository.DTO;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IVehicleService
    {
        Task<IEnumerable<Vehicle>> GetVehicleAllAsync();
        Task<Vehicle?> GetVehicleByIdAsync(Guid id);
        Task<Vehicle> CreateVehicleAsync(Vehicle vehicle);
        Task UpdateVehicleAsync(Guid id, Vehicle vehicle);
        Task<bool> DeleteViheicleAsync(Guid id);
    }
}
