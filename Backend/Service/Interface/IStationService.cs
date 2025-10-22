using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IStationService
    {
        Task<IEnumerable<Station>> GetAllStationsAsync();
        Task<Station?> GetStationByIdAsync(Guid id);
        Task<Station> CreateStationAsync(Station Station);
        Task<Station?> UpdateStationAsync(Guid id, Station Station);
        Task<bool> DeleteStationAsync(Guid id);
    }
}
