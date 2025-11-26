using APIRentEV.Extensions;
using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using System.Linq;
using System.Security.Claims;

namespace APIRentEV.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;
        private readonly IRentalService _rentalService;
        private readonly IMapper _mapper;

        public FeedbackController(IFeedbackService feedbackService, IRentalService rentalService, IMapper mapper)
        {
            _feedbackService = feedbackService;
            _rentalService = rentalService;
            _mapper = mapper;
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetAllFeedback()
        {
            var feedbacks = await _feedbackService.GetAllAsync();
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue)
            {
                feedbacks = feedbacks.Where(f => RentalMatchesStation(f.Rental, staffStationId.Value));
            }
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet("{id}")]
        public async Task<ActionResult<FeedbackDto>> GetFeedbackById(Guid id)
        {
            var feedback = await _feedbackService.GetByIdAsync(id);
            if (feedback == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !RentalMatchesStation(feedback.Rental, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể xem đánh giá thuộc trạm của mình.");
            }

            return Ok(_mapper.Map<FeedbackDto>(feedback));
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("rental/{rentalId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetByRentalId(Guid rentalId)
        {
            var feedbacks = await _feedbackService.GetByRentalIdAsync(rentalId);
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetByUserId(Guid userId)
        {
            var feedbacks = await _feedbackService.GetByUserIdAsync(userId);
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue)
            {
                feedbacks = feedbacks.Where(f => RentalMatchesStation(f.Rental, staffStationId.Value));
            }
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<ActionResult<FeedbackDto>> CreateFeedback([FromBody] FeedbackCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Get userId from JWT token
            var userIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub")
                           ?? User.FindFirstValue("userId");
            
            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var currentUserId))
            {
                return Forbid("User not authenticated or ID invalid");
            }

            // Validate rental ownership and completion
            var rental = await _rentalService.GetPaidRentalByIdAsync(dto.RentalId);
            if (rental == null) return BadRequest(new { message = "Đơn thuê không hợp lệ." });

            if (!string.Equals(rental.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Chỉ được đánh giá khi đơn thuê đã hoàn tất." });
            }

            // Ensure feedback is created by the same user as the rental owner
            if (rental.UserId != currentUserId)
            {
                return Forbid("Bạn không có quyền đánh giá đơn thuê này.");
            }

            // Optional: prevent duplicate feedback per rental per user
            var existingFeedbacks = await _feedbackService.GetByRentalIdAsync(dto.RentalId);
            var userFeedbacks = existingFeedbacks.Where(f => f.UserId == currentUserId);
            if (userFeedbacks.Any())
            {
                return BadRequest(new { message = "Bạn đã đánh giá đơn thuê này rồi." });
            }

            // Also check if user already reviewed this vehicle (via any completed rental)
            var vehicleFeedbacks = await _feedbackService.GetByVehicleIdAsync(rental.VehicleId);
            var userVehicleFeedbacks = vehicleFeedbacks.Where(f => f.UserId == currentUserId);
            if (userVehicleFeedbacks.Any())
            {
                return BadRequest(new { message = "Bạn đã đánh giá xe này rồi." });
            }

            // Create feedback entity manually to ensure userId from token is used
            var feedback = new Feedback
            {
                FeedbackId = Guid.NewGuid(),
                UserId = currentUserId,
                RentalId = dto.RentalId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };
            
            var created = await _feedbackService.AddAsync(feedback);

            return CreatedAtAction(nameof(GetFeedbackById),
                                   new { id = created.FeedbackId },
                                   _mapper.Map<FeedbackDto>(created));
        }

        [Authorize(Roles = "Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(Guid id)
        {
            var success = await _feedbackService.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }
        [Authorize(Roles = "Customer")]
        [HttpGet("rental/{rentalId}/average")]
        public async Task<IActionResult> GetAverage(Guid rentalId)
        {
            var avg = await _feedbackService.GetAverageRatingByRentalAsync(rentalId);
            return Ok(avg);
        }

        // Get feedbacks by vehicle ID (public endpoint for vehicle detail page)
        [AllowAnonymous]
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetByVehicleId(Guid vehicleId)
        {
            var feedbacks = await _feedbackService.GetByVehicleIdAsync(vehicleId);
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        // Get average rating by vehicle ID (public endpoint)
        [AllowAnonymous]
        [HttpGet("vehicle/{vehicleId}/average")]
        public async Task<IActionResult> GetAverageByVehicleId(Guid vehicleId)
        {
            var avg = await _feedbackService.GetAverageRatingByVehicleIdAsync(vehicleId);
            return Ok(new { averageRating = avg });
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

        private static bool RentalMatchesStation(Rental rental, Guid stationId)
        {
            if (rental == null) return false;
            if (rental.PickupStationId == stationId) return true;
            if (rental.ReturnStationId.HasValue && rental.ReturnStationId.Value == stationId) return true;
            if (rental.Vehicle != null && rental.Vehicle.StationId == stationId) return true;
            return false;
        }
    }
}
