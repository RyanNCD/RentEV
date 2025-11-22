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
using System.Threading.Tasks;

namespace APIRentEV.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _reservationService;
        private readonly IMapper _mapper;

        public ReservationController(IReservationService reservationService, IMapper mapper)
        {
            _reservationService = reservationService;
            _mapper = mapper;
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAllReservations()
        {
            var reservations = await _reservationService.GetAllReservationsAsync();
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<ReservationDto>> GetReservationById(Guid id)
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id);
            if (reservation == null) return NotFound();

            return Ok(_mapper.Map<ReservationDto>(reservation));
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<ActionResult<ReservationDto>> CreateReservation([FromBody] ReservationCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var reservation = _mapper.Map<Reservation>(dto);
            var created = await _reservationService.CreateReservationAsync(reservation);

            return CreatedAtAction(nameof(GetReservationById),
                                   new { id = created.ReservationId },
                                   _mapper.Map<ReservationDto>(created));
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpPut("{id}")]
        public async Task<ActionResult<ReservationDto>> UpdateReservation(Guid id, [FromBody] ReservationCreateDto dto)
        {
            var existing = await _reservationService.GetReservationByIdAsync(id);
            if (existing == null) return NotFound();

            var reservation = _mapper.Map<Reservation>(dto);
            reservation.ReservationId = id;
            reservation.ReservedAt = existing.ReservedAt;
            
            var updated = await _reservationService.UpdateReservationAsync(id, reservation);
            return Ok(_mapper.Map<ReservationDto>(updated));
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReservation(Guid id)
        {
            var result = await _reservationService.DeleteReservationAsync(id);
            if (!result) return NotFound();

            return Ok("Reservation deleted successfully.");
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByUser(Guid userId)
        {
            var reservations = await _reservationService.GetReservationsByUserIdAsync(userId);
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByVehicle(Guid vehicleId)
        {
            var reservations = await _reservationService.GetReservationsByVehicleIdAsync(vehicleId);
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }
    }
}
