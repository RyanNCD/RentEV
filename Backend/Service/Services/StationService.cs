using Repository.Implementations;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Services
{
    public class StationService : IStationService
    {
        private readonly StationRepository _stationRepository;


        public StationService(StationRepository stationRepository)
        {
            _stationRepository = stationRepository;

        }
        public async Task<IEnumerable<Station>> GetAllStationsAsync()
        {
            return await _stationRepository.GetStationAllAsync();
        }

        public async Task<Station> GetStationByIdAsync(Guid id)
        {
            return await _stationRepository.GetStationByIdAsync(id);
        }

        public async Task<Station> CreateStationAsync(Station station)
        {
            await _stationRepository.AddStationlAsync(station);
            return station;
        }

        public async Task<Station> UpdateStationAsync(Guid id, Station station)
        {
            await _stationRepository.UpdateAsync(station);
            return station;
        }

        public async Task<bool> DeleteStationAsync(Guid id)
        {
            var existing = await _stationRepository.GetStationByIdAsync(id);
            if (existing == null) return false;

            await _stationRepository.DeleteStationAsync(id);
            return true;
        }
    }
}
