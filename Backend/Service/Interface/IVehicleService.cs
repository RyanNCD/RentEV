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
        Task<List<VehicleDto>> SearchVehiclesAsync(string keyword);
        Task<List<VehicleDto>> FilterVehiclesAsync(Guid? stationId, string status, int? seatingCapacity);
        Task<List<VehicleDto>> SortVehiclesAsync(string sortBy, bool isDescending);
        Task<List<Vehicle>> GetFeaturedVehiclesAsync(int topCount = 5);

    }
}
