using Api.Mappers;
using APIRentEV.Mapper;
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
        private readonly IVehivleService _vehivleService;
        public VehicleController(IVehivleService vehivleService)
        {
            _vehivleService = vehivleService;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleDto>>> GetAllVehicle()
        {
            var vehicles = await _vehivleService.GetVehicleAllAsync();
            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleDto>> GetVehicleVyId(Guid id)
        {
            var vehicle = await _vehivleService.GetVehicleByIdAsync(id);
            if (vehicle == null) return NotFound();

            var dto = new VehicleDto
            {
                VehicleId = vehicle.VehicleId,
                VehicleName = vehicle.VehicleName,
                VehicleType = vehicle.VehicleType,
                BatteryCapacity = vehicle.BatteryCapacity,
                Description = vehicle.Description,
                LicensePlate = vehicle.LicensePlate,
                SeatingCapacity = vehicle.SeatingCapacity,
                Status = vehicle.Status,
                Utilities = vehicle.Utilities,
                StationId = vehicle.StationId
            };

            return Ok(dto);
        }
        [HttpPost]
        public async Task<ActionResult<VehicleDto>> CreateVehicle(VehicleCreateDto dto)
        {
            var user = dto.ToEntity();
            var created = await _vehivleService.CreateVehicleAsync(user);
            return CreatedAtAction(nameof(GetVehicleVyId), new { id = created.VehicleId }, created.ToDto());
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<VehicleDto>> UpdateVehicle(Guid id, VehicleUpdateDto dto)
        {
            var existing = await _vehivleService.GetVehicleByIdAsync(id);
            if (existing == null) return NotFound();

            dto.MapUpdate(existing);
            await _vehivleService.UpdateVehicleAsync(id, existing);

            return Ok(existing.ToDto());
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            var success = await _vehivleService.DeleteViheicleAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
