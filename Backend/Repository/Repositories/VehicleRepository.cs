using Microsoft.EntityFrameworkCore;
using Repository.DTO;
using Repository.Models;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class VehicleRepository
    {
        private readonly SWP391RentEVContext _context;
        public VehicleRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Vehicle>> GetVehicleAllAsync()
        {
            return await _context.Vehicles.ToListAsync();
        }
        public async Task<Vehicle?> GetVehicleByIdAsync(Guid id)
        {
            return await _context.Vehicles.FirstOrDefaultAsync(u => u.VehicleId == id);
        }

        public async Task AddVehicelAsync(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
        }

        public async Task<int> UpdateAsync(Vehicle vehicle)
        {
            _context.Vehicles.Update(vehicle);
            return await _context.SaveChangesAsync();
        }


        public async Task DeleteVeicleAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle != null)
            {
                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();
            }
        }
    }
}
