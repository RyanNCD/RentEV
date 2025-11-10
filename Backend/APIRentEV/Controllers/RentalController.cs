using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace APIRentEV.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RentalController : ControllerBase
    {
        private readonly IRentalService _rentalService;
        private readonly IMapper _mapper;

        public RentalController(IRentalService rentalService, IMapper mapper)
        {
            _rentalService = rentalService;
            _mapper = mapper;
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RentalDto>>> GetAllRentals()
        {
            var rentals = await _rentalService.GetAllRentalAsync();
            var dtos = _mapper.Map<List<RentalDto>>(rentals);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<RentalDto>> GetRentalById(Guid id)
        {
            var rental = await _rentalService.GetRentalByIdAsync(id);
            if (rental == null) return NotFound();

            return Ok(_mapper.Map<RentalDto>(rental));
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<ActionResult<RentalDto>> CreateRental([FromBody] RentalCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var rental = _mapper.Map<Rental>(dto);
            var created = await _rentalService.CreateRentalAsync(rental);

            return CreatedAtAction(nameof(GetRentalById),
                                   new { id = created.RentalId },
                                   _mapper.Map<RentalDto>(created));
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpPut("{id}")]
        public async Task<ActionResult<RentalDto>> UpdateRental(Guid id, [FromBody] RentalUpdateDto dto)
        {
            var existing = await _rentalService.GetRentalByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing);
            await _rentalService.UpdateRentalAsync(id, existing);

            return Ok(_mapper.Map<RentalDto>(existing));
        }

        [Authorize(Roles = "Customer")]
        [HttpPut("cancel/{id}")]
        public async Task<IActionResult> CancelRental(Guid id)
        {
            try
            {
                var result = await _rentalService.CancelRentalAsync(id);
                if (!result)
                    return NotFound("Rental not found.");

                return Ok("Rental cancelled successfully.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet("checkin")]
        public async Task<ActionResult<IEnumerable<RentalDto>>> GetCheckinRentals()
        {
            // Lấy các rental đang chờ checkin (Pending hoặc Confirmed)
            var allRentals = await _rentalService.GetAllRentalAsync();
            var checkinRentals = allRentals.Where(r => r.Status == "Pending" || r.Status == "Confirmed");
            var dtos = _mapper.Map<List<RentalDto>>(checkinRentals);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpPost("checkin/{id}")]
        public async Task<ActionResult<RentalDto>> CheckinRental(Guid id, [FromBody] VehicleConditionCheckDto conditionCheck)
        {
            try
            {
                // Lấy StaffId từ token
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out Guid staffId))
                {
                    return Unauthorized("Staff ID not found in token.");
                }

                var rental = await _rentalService.CheckinRentalAsync(id, staffId, conditionCheck);
                if (rental == null)
                    return NotFound();

                return Ok(_mapper.Map<RentalDto>(rental));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet("return")]
        public async Task<ActionResult<IEnumerable<RentalDto>>> GetReturnRentals()
        {
            // Lấy các rental đang active (cần trả xe)
            var allRentals = await _rentalService.GetAllRentalAsync();
            var returnRentals = allRentals.Where(r => r.Status == "Active");
            var dtos = _mapper.Map<List<RentalDto>>(returnRentals);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpPost("return/{id}")]
        public async Task<ActionResult<RentalDto>> ReturnRental(Guid id, [FromBody] VehicleConditionCheckDto conditionCheck)
        {
            try
            {
                // Lấy StaffId từ token
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out Guid staffId))
                {
                    return Unauthorized("Staff ID not found in token.");
                }

                var rental = await _rentalService.ReturnRentalAsync(id, staffId, conditionCheck);
                if (rental == null)
                    return NotFound();

                return Ok(_mapper.Map<RentalDto>(rental));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}/images")]
        public async Task<ActionResult<IEnumerable<RentalImageDto>>> GetRentalImages(Guid id, [FromQuery] string type = null)
        {
            var rental = await _rentalService.GetRentalByIdAsync(id);
            if (rental == null) return NotFound();

            // This will be handled by a separate endpoint in RentalImageController or we can add it here
            // For now, return the images from the rental object if loaded
            return Ok(new List<RentalImageDto>());
        }

    }
}   