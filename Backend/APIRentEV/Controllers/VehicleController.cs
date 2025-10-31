
using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using Service.Services;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;
        private readonly IMapper _mapper;

        public VehicleController(IVehicleService vehicleService, IMapper mapper)
        {
            _vehicleService = vehicleService;
            _mapper = mapper;
        }

        // GET: api/Vehicle
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleDto>>> GetAllVehicle()
        {
            var vehicles = await _vehicleService.GetVehicleAllAsync();
            var dtos = _mapper.Map<List<VehicleDto>>(vehicles);
            return Ok(dtos);
        }

        // GET: api/Vehicle/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleDto>> GetVehicleById(Guid id)
        {
            var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
            if (vehicle == null) return NotFound();

            return Ok(_mapper.Map<VehicleDto>(vehicle));
        }

        // POST: api/Vehicle
        [HttpPost]
        public async Task<ActionResult<VehicleDto>> CreateVehicle([FromBody] VehicleCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var vehicle = _mapper.Map<Vehicle>(dto);
            var created = await _vehicleService.CreateVehicleAsync(vehicle);

            return CreatedAtAction(nameof(GetVehicleById),
                                   new { id = created.VehicleId },
                                   _mapper.Map<VehicleDto>(created));
        }

        // PUT: api/Vehicle/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<VehicleDto>> UpdateVehicle(Guid id, [FromBody] VehicleUpdateDto dto)
        {
            var existing = await _vehicleService.GetVehicleByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing); // AutoMapper sẽ map các field không null
            await _vehicleService.UpdateVehicleAsync(id, existing);

            return Ok(_mapper.Map<VehicleDto>(existing));
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            var success = await _vehicleService.DeleteViheicleAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchVehicles([FromQuery] string keyword)
        {
            var result = await _vehicleService.SearchVehiclesAsync(keyword);
            return Ok(result);
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterVehicles([FromQuery] Guid? stationId, [FromQuery] string status, [FromQuery] int? seatingCapacity)
        {
            var result = await _vehicleService.FilterVehiclesAsync(stationId, status, seatingCapacity);
            return Ok(result);
        }

        [HttpGet("sort")]
        public async Task<IActionResult> SortVehicles([FromQuery] string sortBy, [FromQuery] bool isDescending = false)
        {
            var result = await _vehicleService.SortVehiclesAsync(sortBy, isDescending);
            return Ok(result);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedVehicles([FromQuery] int top = 5)
        {
            var vehicles = await _vehicleService.GetFeaturedVehiclesAsync(top);
            if (vehicles == null || !vehicles.Any())
                return NotFound("No featured vehicles found.");

            var result = vehicles.Select(v => new VehicleDto
            {
                VehicleId = v.VehicleId,
                StationId = v.StationId,
                VehicleName = v.VehicleName,
                VehicleType = v.VehicleType,
                BatteryCapacity = v.BatteryCapacity,
                LicensePlate = v.LicensePlate,
                Status = v.Status,
                PricePerDay = v.PricePerDay,
                Description = v.Description,
                SeatingCapacity = v.SeatingCapacity,
                Utilities = v.Utilities,
                NumberOfRenters = v.NumberOfRenters
            });

            return Ok(result);
        }


    }
}
