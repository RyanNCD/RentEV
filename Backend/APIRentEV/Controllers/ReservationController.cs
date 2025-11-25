using APIRentEV.Extensions;
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

        [Authorize(Roles = "StaffStation")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAllReservations()
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var reservations = await _reservationService.GetAllReservationsAsync();
            if (isStaff && staffStationId.HasValue)
            {
                reservations = reservations.Where(r => ReservationMatchesStation(r, staffStationId.Value));
            }
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<ReservationDto>> GetReservationById(Guid id)
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id);
            if (reservation == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !ReservationMatchesStation(reservation, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể truy cập đặt xe thuộc trạm của mình.");
            }

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

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpPut("{id}")]
        public async Task<ActionResult<ReservationDto>> UpdateReservation(Guid id, [FromBody] ReservationCreateDto dto)
        {
            var existing = await _reservationService.GetReservationByIdAsync(id);
            if (existing == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !ReservationMatchesStation(existing, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể cập nhật đặt xe thuộc trạm của mình.");
            }

            var reservation = _mapper.Map<Reservation>(dto);
            reservation.ReservationId = id;
            reservation.ReservedAt = existing.ReservedAt;
            
            var updated = await _reservationService.UpdateReservationAsync(id, reservation);
            return Ok(_mapper.Map<ReservationDto>(updated));
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReservation(Guid id)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue)
            {
                var reservation = await _reservationService.GetReservationByIdAsync(id);
                if (reservation == null) return NotFound();
                if (!ReservationMatchesStation(reservation, staffStationId.Value))
                {
                    return Forbid("Bạn chỉ có thể xóa đặt xe thuộc trạm của mình.");
                }
            }

            var result = await _reservationService.DeleteReservationAsync(id);
            if (!result) return NotFound();

            return Ok("Reservation deleted successfully.");
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByUser(Guid userId)
        {
            var reservations = await _reservationService.GetReservationsByUserIdAsync(userId);
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue)
            {
                reservations = reservations.Where(r => ReservationMatchesStation(r, staffStationId.Value)).ToList();
            }
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByVehicle(Guid vehicleId)
        {
            var reservations = await _reservationService.GetReservationsByVehicleIdAsync(vehicleId);
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue)
            {
                reservations = reservations.Where(r => ReservationMatchesStation(r, staffStationId.Value)).ToList();
            }
            var dtos = _mapper.Map<List<ReservationDto>>(reservations);
            return Ok(dtos);
        }

        private (bool isStaff, Guid? stationId, ActionResult? errorResult) ResolveStaffContext()
        {
            var isStaff = User?.IsInRole("StaffStation") ?? false;
            if (!isStaff)
            {
                return (false, null, null);
            }

            var stationId = User.GetStationId();
            if (!stationId.HasValue)
            {
                return (true, null, Forbid("Tài khoản Staff chưa được gán trạm. Vui lòng liên hệ Admin để cập nhật."));
            }

            return (true, stationId, null);
        }

        private static bool ReservationMatchesStation(Reservation reservation, Guid stationId)
        {
            if (reservation == null) return false;
            if (reservation.StationId == stationId) return true;
            if (reservation.Vehicle != null && reservation.Vehicle.StationId == stationId) return true;
            return false;
        }
    }
}
