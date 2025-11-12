using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using Service.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationController : ControllerBase
    {
        private readonly IStationService _stationService;
        private readonly IMapper _mapper;

        public StationController(IStationService stationService, IMapper mapper)
        {
            _stationService = stationService;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StationDto>>> GetAllStations()
        {
            var stations = await _stationService.GetAllStationsAsync();
            var dtos = _mapper.Map<List<StationDto>>(stations);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<StationDto>> GetStationById(Guid id)
        {
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null) return NotFound();

            return Ok(_mapper.Map<StationDto>(station));
        }

        [Authorize(Roles = "Admim")]
        [HttpPost]
        public async Task<ActionResult<StationDto>> CreateStation([FromBody] StationCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var station = _mapper.Map<Station>(dto);
            var created = await _stationService.CreateStationAsync(station);

            return CreatedAtAction(nameof(GetStationById),
                                   new { id = created.StationId },
                                   _mapper.Map<StationDto>(created));
        }

        [Authorize(Roles = "Admim")]
        [HttpPut("{id}")]
        public async Task<ActionResult<StationDto>> UpdateStation(Guid id, [FromBody] StationUpdateDto dto)
        {
            var existing = await _stationService.GetStationByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing); // AutoMapper map các field không null
            await _stationService.UpdateStationAsync(id, existing);

            return Ok(_mapper.Map<StationDto>(existing));
        }

        [Authorize(Roles = "Admim")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStation(Guid id)
        {
            var success = await _stationService.DeleteStationAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
