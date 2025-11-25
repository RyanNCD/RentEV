using APIRentEV.Extensions;
using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using System;
using System.Linq;

namespace APIRentEV.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RentalController : ControllerBase
    {
        private readonly IRentalService _rentalService;
        private readonly IPaymentService _paymentService;
        private readonly IRentalImageService _imageService;
        private readonly IMapper _mapper;

        public RentalController(IRentalService rentalService, IPaymentService paymentService, IRentalImageService imageService, IMapper mapper)
        {
            _rentalService = rentalService;
            _paymentService = paymentService;
            _imageService = imageService;
            _mapper = mapper;
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet]
        public async Task<ActionResult> GetAllRentals(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] Guid? stationId = null)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var effectiveStationId = isStaff ? staffStationId : stationId;

            // If no pagination parameters provided, return all (backward compatibility)
            if (!page.HasValue && !pageSize.HasValue && string.IsNullOrEmpty(status) && string.IsNullOrEmpty(search) && !startDate.HasValue && !endDate.HasValue && !stationId.HasValue)
            {
                var rentals = await _rentalService.GetPaidRentalsAsync();
                if (isStaff && staffStationId.HasValue)
                {
                    rentals = rentals.Where(r => RentalMatchesStation(r, staffStationId.Value));
                }
                var dtos = _mapper.Map<List<RentalDto>>(rentals);
                return Ok(dtos);
            }

            // Use paginated endpoint (always return paged result when pagination params are provided)
            var currentPage = page ?? 1;
            var currentPageSize = pageSize ?? 10;
            var (items, totalCount) = await _rentalService.GetPaidRentalsPagedAsync(currentPage, currentPageSize, status, search, startDate, endDate, effectiveStationId);
            var pagedDtos = _mapper.Map<List<RentalDto>>(items);
            
            var result = new
            {
                items = pagedDtos,
                totalCount,
                page = currentPage,
                pageSize = currentPageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)currentPageSize),
                hasPreviousPage = currentPage > 1,
                hasNextPage = currentPage < Math.Ceiling(totalCount / (double)currentPageSize)
            };

            return Ok(result);
        }

        // === FIND BY CODE (use RentalId GUID as the code) ===
        [Authorize(Roles = "StaffStation")]
        [HttpGet("find-by-code/{code}")]
        public async Task<IActionResult> FindByCode(string code)
        {
            Rental? rental = null;
            if (Guid.TryParse(code, out var rentalId))
            {
                rental = await _rentalService.GetPaidRentalByIdAsync(rentalId);
            }
            else
            {
                var payment = await _paymentService.GetPaymentByTransactionIdAsync(code);
                if (payment != null)
                {
                    // Only accept if the payment is successful
                    if (!string.IsNullOrWhiteSpace(payment.Status) && string.Equals(payment.Status.Trim(), "Success", StringComparison.OrdinalIgnoreCase))
                    {
                        rental = payment.Rental;
                    }
                }
            }

            if (rental == null) return NotFound(new { message = "Không tìm thấy đơn thuê." });

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !RentalMatchesStation(rental, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể truy cập đơn thuê thuộc trạm của mình.");
            }

            var vehicleName = rental.Vehicle?.VehicleName ?? "";
            return Ok(new
            {
                id = rental.RentalId,
                vehicleName,
                startDate = rental.StartTime,
                endDate = rental.EndTime,
                totalCost = rental.TotalCost ?? 0,
                status = NormalizeStatus(rental.Status)
            });
        }

        private static string NormalizeStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "PENDING";
            // Map common statuses to FE expected upper-case
            switch (status.Trim().ToUpperInvariant())
            {
                case "PENDING": return "PENDING";
                case "PAID": return "PAID";
                case "IN_PROGRESS": return "IN_PROGRESS";
                case "COMPLETED": return "COMPLETED";
                case "CANCELLED": return "CANCELLED";
                default: return status.Trim().ToUpperInvariant();
            }
        }
        // Kiểm tra đã thanh toán dựa trên Payment
        private async Task<bool> IsRentalPaidByPaymentAsync(Guid rentalId)
        {
            return await _paymentService.IsRentalPaidAsync(rentalId);
        }

        public class StaffBookingDto
        {
            public Guid Id { get; set; }
            public string VehicleName { get; set; } = string.Empty;
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public decimal TotalCost { get; set; }
            public string Status { get; set; } = "PENDING";
        }

        public class CheckInDto
        {
            public Guid BookingId { get; set; }
            public DateTime? DeliveredAt { get; set; }
            public string? DeliveryCondition { get; set; }
        }

        public class CheckOutDto
        {
            public Guid BookingId { get; set; }
            public DateTime? ReceivedAt { get; set; }
            public string? ReturnCondition { get; set; }
        }

        // === CHECK-IN ===
        // Chỉ StaffStation được phép bàn giao xe, Admin chỉ được xem
        [Authorize(Roles = "StaffStation")]
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            var (_, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (!staffStationId.HasValue)
            {
                return Forbid("Tài khoản staff chưa được gán trạm.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var staffId))
            {
                return Forbid();
            }

            var deliveredAt = dto.DeliveredAt ?? DateTime.UtcNow;
            try
            {
                var rentalDetail = await _rentalService.GetRentalByIdAsync(dto.BookingId);
                if (rentalDetail == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn thuê." });
                }
                if (rentalDetail.PickupStationId != staffStationId.Value)
                {
                    return Forbid("Bạn không thể bàn giao xe cho trạm khác.");
                }

                // Bắt buộc: rental phải có payment thành công
                var paid = await IsRentalPaidByPaymentAsync(dto.BookingId);
                if (!paid)
                {
                    return BadRequest(new { message = "Đơn thuê chưa có payment thành công, không thể check-in." });
                }
                var rental = await _rentalService.CheckInAsync(dto.BookingId, staffId, deliveredAt, dto.DeliveryCondition);
                if (rental == null) return NotFound(new { message = "Không tìm thấy đơn thuê." });

                var vehicleName = rental.Vehicle?.VehicleName ?? "";
                return Ok(new
                {
                    id = rental.RentalId,
                    vehicleName,
                    startDate = rental.StartTime,
                    endDate = rental.EndTime,
                    totalCost = rental.TotalCost ?? 0,
                    status = NormalizeStatus(rental.Status)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // === CHECK-OUT ===
        // Chỉ StaffStation được phép nhận xe, Admin chỉ được xem
        [Authorize(Roles = "StaffStation")]
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
        {
            var (_, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (!staffStationId.HasValue)
            {
                return Forbid("Tài khoản staff chưa được gán trạm.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var staffId))
            {
                return Forbid();
            }

            var receivedAt = dto.ReceivedAt ?? DateTime.UtcNow;
            try
            {
                var rentalDetail = await _rentalService.GetRentalByIdAsync(dto.BookingId);
                if (rentalDetail == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn thuê." });
                }
                var targetStationId = rentalDetail.ReturnStationId ?? rentalDetail.PickupStationId;
                if (targetStationId != staffStationId.Value)
                {
                    return Forbid("Bạn không thể nhận xe cho trạm khác.");
                }

                var rental = await _rentalService.CheckOutAsync(dto.BookingId, staffId, receivedAt, dto.ReturnCondition);
                if (rental == null) return NotFound(new { message = "Không tìm thấy đơn thuê." });

                var vehicleName = rental.Vehicle?.VehicleName ?? "";
                return Ok(new
                {
                    id = rental.RentalId,
                    vehicleName,
                    startDate = rental.StartTime,
                    endDate = rental.EndTime,
                    totalCost = rental.TotalCost ?? 0,
                    status = NormalizeStatus(rental.Status)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<RentalDto>> GetRentalById(Guid id)
        {
            var rental = await _rentalService.GetPaidRentalByIdAsync(id);
            if (rental == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !RentalMatchesStation(rental, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể xem đơn thuê thuộc trạm của mình.");
            }

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

        [Authorize(Roles = "StaffStation")]
        [HttpPut("{id}")]
        public async Task<ActionResult<RentalDto>> UpdateRental(Guid id, [FromBody] RentalUpdateDto dto)
        {
            var existing = await _rentalService.GetRentalByIdAsync(id);
            if (existing == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && !RentalMatchesStation(existing, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể cập nhật đơn thuê thuộc trạm của mình.");
            }

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

        [Authorize(Roles = "Customer")]
        [HttpGet("my-history")]
        public async Task<ActionResult<IEnumerable<RentalDto>>> GetMyHistory()
        {
            // [Inference] We extract userId from JWT claims; claim type may vary.
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub")
                           ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return BadRequest(new { message = "Invalid or missing userId in token." });
            }

            var rentals = await _rentalService.GetPaidRentalsByUserAsync(userId);
            var dtos = _mapper.Map<List<RentalDto>>(rentals);
            return Ok(dtos);
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("my-history-paged")]
        public async Task<ActionResult> GetMyHistoryPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub")
                           ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return BadRequest(new { message = "Invalid or missing userId in token." });
            }

            var currentPage = Math.Max(1, page);
            var currentPageSize = Math.Max(1, Math.Min(100, pageSize)); // Limit to 100 per page

            var (items, totalCount) = await _rentalService.GetPaidRentalsByUserPagedAsync(
                userId, currentPage, currentPageSize, search, startDate, endDate);

            var dtos = _mapper.Map<List<RentalDto>>(items);

            var result = new
            {
                items = dtos,
                totalCount,
                page = currentPage,
                pageSize = currentPageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)currentPageSize),
                hasPreviousPage = currentPage > 1,
                hasNextPage = currentPage < Math.Ceiling(totalCount / (double)currentPageSize)
            };

            return Ok(result);
        }

        // Check if user has completed rental for a vehicle (for feedback eligibility)
        [Authorize(Roles = "Customer")]
        [HttpGet("check-feedback-eligibility/{vehicleId}")]
        public async Task<ActionResult> CheckFeedbackEligibility(Guid vehicleId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub")
                           ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return BadRequest(new { message = "Invalid or missing userId in token." });
            }

            var rental = await _rentalService.GetCompletedRentalByUserAndVehicleAsync(userId, vehicleId);
            
            if (rental == null)
            {
                return Ok(new { 
                    canReview = false, 
                    message = "Bạn chưa hoàn thành thuê xe này." 
                });
            }

            return Ok(new { 
                canReview = true, 
                rentalId = rental.RentalId,
                message = "Bạn có thể đánh giá xe này." 
            });
        }

        // Get rental images - Public endpoint for customers to view their rental images
        [Authorize(Roles = "Customer")]
        [HttpGet("{rentalId}/images")]
        public async Task<ActionResult> GetRentalImagesForCustomer(Guid rentalId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub")
                           ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return BadRequest(new { message = "Invalid or missing userId in token." });
            }

            // Verify that the rental belongs to the user
            var rental = await _rentalService.GetRentalByIdAsync(rentalId);
            if (rental == null)
            {
                return NotFound(new { message = "Rental not found." });
            }

            if (rental.UserId != userId)
            {
                return Forbid("You can only view images of your own rentals.");
            }

            // Get images
            var images = await _imageService.GetByRentalIdAsync(rentalId);
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var result = images.Select(i => new {
                imageId = i.ImageId,
                rentalId = i.RentalId,
                imageUrl = string.IsNullOrWhiteSpace(i.ImageUrl) ? null : $"{baseUrl}{i.ImageUrl}",
                type = i.Type,
                description = i.Description,
                note = i.Note,
                createdAt = i.CreatedAt
            });
            return Ok(result);
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
            return false;
        }
    }
}   