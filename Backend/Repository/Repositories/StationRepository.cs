using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class StationRepository
    {
        private readonly SWP391RentEVContext _context;

        public StationRepository(SWP391RentEVContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<Station>> GetStationAllAsync()
        {
            return await _context.Stations.ToListAsync();
        }
        public async Task<Station?> GetStationByIdAsync(Guid id)
        {
            return await _context.Stations.FirstOrDefaultAsync(u => u.StationId == id);
        }

        public async Task AddStationlAsync(Station Station)
        {
            _context.Stations.Add(Station);
            await _context.SaveChangesAsync();
        }

        public async Task<int> UpdateAsync(Station Station)
        {
            _context.Stations.Update(Station);
            return await _context.SaveChangesAsync();
        }


        public async Task DeleteStationAsync(Guid id)
        {
            var Station = await _context.Stations.FindAsync(id);
            if (Station != null)
            {
                _context.Stations.Remove(Station);
                await _context.SaveChangesAsync();
            }
        }
    }
}
