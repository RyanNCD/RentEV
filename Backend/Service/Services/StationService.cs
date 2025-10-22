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
        public async Task<Station> CreateStationAsync(Station Station)
        {
            Station.StationId = Guid.NewGuid();
            await _stationRepository.AddStationlAsync(Station);
            return Station;
        }

        public async Task<bool> DeleteStationAsync(Guid id)
        {
            var existing = await _stationRepository.GetStationByIdAsync(id);
            if (existing == null) return false;

            await _stationRepository.DeleteStationAsync(id);
            return true;
        }

        public async Task<IEnumerable<Station>> GetAllStationsAsync()
        {
            return await _stationRepository.GetStationAllAsync();
        }

        public async Task<Station?> GetStationByIdAsync(Guid id)
        {
            return await _stationRepository.GetStationByIdAsync(id);
        }

        public async Task<Station?> UpdateStationAsync(Guid id, Station Station)
        {
            if (Station == null)
                throw new ArgumentNullException(nameof(Station));

            // Lấy dữ liệu hiện có trong DB
            var existingStation = await _stationRepository.GetStationByIdAsync(id);
            if (existingStation == null)
                throw new KeyNotFoundException($"Station with ID {id} not found");
            // Cập nhật các trường cho phép sửa
            existingStation.StationName = Station.StationName;
            existingStation.Latitude = Station.Latitude;
            existingStation.Longitude = Station.Longitude;
            existingStation.Address = Station.Address;
            existingStation.CreatedAt = Station.CreatedAt;

            await _stationRepository.UpdateAsync(existingStation);
            return existingStation;
        }
    }
}
