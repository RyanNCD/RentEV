using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using APIRentEV.Mapper;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationController : ControllerBase
    {
        private readonly IStationService _stationService;

        public StationController(IStationService stationService)
        {
            _stationService = stationService;
        }

        // ✅ GET: api/station
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StationDto>>> GetAllStations()
        {
            var stations = await _stationService.GetAllStationsAsync();
            if (!stations.Any())
            {
                return Ok(new
                {
                    message = "No stations found in the system.",
                    data = stations
                });
            }

            return Ok(new
            {
                message = "Successfully retrieved all stations.",
                total = stations.Count(),
                data = stations
            });
        }

        // ✅ GET: api/station/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<StationDto>> GetStationById(Guid id)
        {
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null)
            {
                return NotFound(new
                {
                    message = $"Station with ID {id} not found."
                });
            }

            return Ok(new
            {
                message = "Station retrieved successfully.",
                data = station.ToDto()
            });
        }

        // ✅ POST: api/station
        [HttpPost]
        public async Task<ActionResult<StationDto>> CreateStation(StationCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid input data.", errors = ModelState });

            var station = dto.ToEntity();
            var createdStation = await _stationService.CreateStationAsync(station);

            return CreatedAtAction(nameof(GetStationById), new { id = createdStation.StationId }, new
            {
                message = "Station created successfully.",
                data = createdStation.ToDto()
            });
        }

        // ✅ PUT: api/station/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<StationDto>> UpdateStation(Guid id, StationUpdateDto dto)
        {
            var existing = await _stationService.GetStationByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new
                {
                    message = $"Station with ID {id} not found."
                });
            }

            dto.MapUpdate(existing);
            var updated = await _stationService.UpdateStationAsync(id, existing);

            return Ok(new
            {
                message = "Station updated successfully.",
                data = updated?.ToDto()
            });
        }

        // ✅ DELETE: api/station/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStation(Guid id)
        {
            var result = await _stationService.DeleteStationAsync(id);
            if (!result)
            {
                return NotFound(new
                {
                    message = $"Station with ID {id} not found or could not be deleted."
                });
            }

            return Ok(new
            {
                message = "Station deleted successfully."
            });
        }
    }
}
