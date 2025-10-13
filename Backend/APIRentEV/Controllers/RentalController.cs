using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Service.Interface;

namespace APIRentEV.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentalController : ControllerBase
    {
        private readonly IRentalService _rentalService;

        public RentalController(IRentalService rentalService)
        {
            _rentalService = rentalService;
        }

        [HttpPost("book")]
        public async Task<ActionResult<RentalDto>> BookRental([FromBody] RentalCreateDto dto)
        {
            try
            {
                var rental = await _rentalService.CreateRentalAsync(dto);

                var result = new RentalDto
                {
                    RentalId = rental.RentalId,
                    UserId = rental.UserId,
                    VehicleId = rental.VehicleId,
                    PickupStationId = rental.PickupStationId,
                    ReturnStationId = rental.ReturnStationId,
                    StartTime = (DateTime)rental.StartTime,
                    EndTime = rental.EndTime,
                    PickupNote = rental.PickupNote,
                    PickupPhotoUrl = rental.PickupPhotoUrl,
                    ReturnNote = rental.ReturnNote,
                    ReturnPhotoUrl = rental.ReturnPhotoUrl,
                    Status = rental.Status,
                    TotalCost = rental.TotalCost
                };

                return CreatedAtAction(nameof(GetRentalById),
                    new { id = rental.RentalId },
                    result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RentalDto>> GetRentalById(Guid id)
        {
            var rental = await _rentalService.GetRentalByIdAsync(id);
            if (rental == null) return NotFound();

            return Ok(new RentalDto
            {
                RentalId = rental.RentalId,
                UserId = rental.UserId,
                VehicleId = rental.VehicleId,
                PickupStationId = rental.PickupStationId,
                ReturnStationId = rental.ReturnStationId,
                StaffId = rental.StaffId,
                PickupNote = rental.PickupNote,
                PickupPhotoUrl = rental.PickupPhotoUrl,
                ReturnNote = rental.ReturnNote,
                ReturnPhotoUrl = rental.ReturnPhotoUrl,
                StartTime = (DateTime)rental.StartTime,
                EndTime = rental.EndTime,
                Status = rental.Status,
                TotalCost = rental.TotalCost
            });
        }
        [HttpPut("update")]
        public async Task<IActionResult> UpdateRental(Guid id, [FromBody] RentalUpdateDto dto)
        {
            if (id != dto.RentalId)
                return BadRequest("RentalId không khớp.");

            var updated = await _rentalService.UpdateRentalAsync(dto);
            if (updated == null)
                return NotFound("Không tìm thấy hợp đồng thuê.");

            return Ok(updated);
        }
    }
}   