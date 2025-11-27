
using System;
using System.Linq;
using APIRentEV.Extensions;
using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
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

        // Helper method để map ImageUrl với base URL của API
        private string MapImageUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            // Nếu đã là absolute URL (http/https), trả về nguyên
            if (imageUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                imageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return imageUrl;

            // Map relative path với base URL của API
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            // Đảm bảo imageUrl bắt đầu bằng /
            var path = imageUrl.StartsWith("/") ? imageUrl : $"/{imageUrl}";
            return $"{baseUrl}{path}";
        }

        // Helper method để map VehicleDto với ImageUrl
        private VehicleDto MapVehicleDtoImageUrl(VehicleDto dto)
        {
            if (dto == null) return dto;
            dto.ImageUrl = MapImageUrl(dto.ImageUrl);
            return dto;
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet]
        public async Task<ActionResult> GetAllVehicle(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] Guid? stationId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var effectiveStationId = isStaff ? staffStationId : stationId;

            // If no pagination parameters provided, return all (backward compatibility)
            if (!page.HasValue && !pageSize.HasValue && !stationId.HasValue && string.IsNullOrEmpty(status) && string.IsNullOrEmpty(search))
            {
                var vehicles = await _vehicleService.GetVehicleAllAsync();
                if (isStaff && staffStationId.HasValue)
                {
                    vehicles = vehicles.Where(v => v.StationId == staffStationId.Value);
                }
                var dtos = _mapper.Map<List<VehicleDto>>(vehicles);
                // Map ImageUrl với base URL
                dtos = dtos.Select(MapVehicleDtoImageUrl).ToList();
                return Ok(dtos);
            }

            // Use paginated endpoint
            var currentPage = page ?? 1;
            var currentPageSize = pageSize ?? 10;
            var (items, totalCount) = await _vehicleService.GetVehiclesPagedAsync(currentPage, currentPageSize, effectiveStationId, status, search);
            var pagedDtos = items.Select(MapVehicleDtoImageUrl).ToList();

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

        // Public endpoint - không cần authentication để xem chi tiết xe
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleDto>> GetVehicleById(Guid id)
        {
            var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
            if (vehicle == null) return NotFound();

            var dto = _mapper.Map<VehicleDto>(vehicle);
            // Map ImageUrl với base URL
            MapVehicleDtoImageUrl(dto);
            return Ok(dto);
        }

        [Authorize(Roles = "StaffStation")]
        [HttpPost]
        public async Task<ActionResult<VehicleDto>> CreateVehicle([FromBody] VehicleCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var (_, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (!staffStationId.HasValue)
            {
                return Forbid("Staff chưa được gán trạm. Vui lòng liên hệ quản trị.");
            }
            dto.StationId = staffStationId.Value;

            var vehicle = _mapper.Map<Vehicle>(dto);
            var created = await _vehicleService.CreateVehicleAsync(vehicle);

            var result = _mapper.Map<VehicleDto>(created);
            // Map ImageUrl với base URL
            MapVehicleDtoImageUrl(result);
            return CreatedAtAction(nameof(GetVehicleById),
                                   new { id = created.VehicleId },
                                   result);
        }

        [Authorize(Roles = "StaffStation")]
        [HttpPut("{id}")]
        public async Task<ActionResult<VehicleDto>> UpdateVehicle(Guid id, [FromBody] VehicleUpdateDto dto)
        {
            try
            {
                var existing = await _vehicleService.GetVehicleByIdAsync(id);
                if (existing == null) return NotFound();

                var (isStaff, staffStationId, stationError) = ResolveStaffContext();
                if (stationError != null)
                {
                    return stationError;
                }
                // Staff chỉ có thể quản lý xe thuộc trạm của mình
                if (isStaff && staffStationId.HasValue && existing.StationId != staffStationId.Value)
                {
                    return Forbid("Bạn chỉ có thể quản lý xe thuộc trạm của mình.");
                }
                
                // Nếu staff cố gắng chuyển xe từ trạm khác về trạm của mình thì không cho phép
                // (Trường hợp này đã được chặn ở check trên, nhưng để an toàn thêm check này)
                if (isStaff && staffStationId.HasValue && dto.StationId != Guid.Empty)
                {
                    // Nếu xe không thuộc trạm của staff nhưng cố set về trạm của staff
                    if (existing.StationId != staffStationId.Value && dto.StationId == staffStationId.Value)
                    {
                        return Forbid("Bạn không thể chuyển xe từ trạm khác về trạm của mình.");
                    }
                    // Nếu xe thuộc trạm của staff: Cho phép chuyển sang trạm khác (không force stationId)
                }

                _mapper.Map(dto, existing); // AutoMapper sẽ map các field không null
                await _vehicleService.UpdateVehicleAsync(id, existing);

                var result = _mapper.Map<VehicleDto>(existing);
                // Map ImageUrl với base URL
                MapVehicleDtoImageUrl(result);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [Authorize(Roles = "StaffStation")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            try
            {
                var (isStaff, staffStationId, stationError) = ResolveStaffContext();
                if (stationError != null)
                {
                    return stationError;
                }
                var existing = await _vehicleService.GetVehicleByIdAsync(id);
                if (existing == null) return NotFound();
                if (isStaff && staffStationId.HasValue && existing.StationId != staffStationId.Value)
                {
                    return Forbid("Bạn chỉ có thể xóa xe thuộc trạm của mình.");
                }

                var success = await _vehicleService.DeleteViheicleAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("search")]
        public async Task<IActionResult> SearchVehicles([FromQuery] string keyword)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var result = await _vehicleService.SearchVehiclesAsync(keyword);
            if (isStaff && staffStationId.HasValue)
            {
                result = result.Where(v => v.StationId == staffStationId.Value).ToList();
            }
            // Map ImageUrl với base URL
            result = result.Select(MapVehicleDtoImageUrl).ToList();
            return Ok(result);
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("filter")]
        public async Task<IActionResult> FilterVehicles([FromQuery] Guid? stationId, [FromQuery] string status, [FromQuery] int? seatingCapacity)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            var effectiveStationId = isStaff ? staffStationId : stationId;

            var result = await _vehicleService.FilterVehiclesAsync(effectiveStationId, status, seatingCapacity);
            // Map ImageUrl với base URL
            result = result.Select(MapVehicleDtoImageUrl).ToList();
            return Ok(result);
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("sort")]
        public async Task<IActionResult> SortVehicles([FromQuery] string sortBy, [FromQuery] bool isDescending = false)
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var result = await _vehicleService.SortVehiclesAsync(sortBy, isDescending);
            if (isStaff && staffStationId.HasValue)
            {
                result = result.Where(v => v.StationId == staffStationId.Value).ToList();
            }
            // Map ImageUrl với base URL
            result = result.Select(MapVehicleDtoImageUrl).ToList();
            return Ok(result);
        }
        [AllowAnonymous]
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
                NumberOfRenters = v.NumberOfRenters,
                ImageUrl = v.ImageUrl
            }).ToList();

            // Map ImageUrl với base URL
            result = result.Select(MapVehicleDtoImageUrl).ToList();
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableVehicles([FromQuery] DateTime? startTime = null, [FromQuery] DateTime? endTime = null)
        {
            var vehicles = await _vehicleService.GetAvailableVehiclesAsync(startTime, endTime);
            // Map ImageUrl với base URL của API
            var result = vehicles.Select(MapVehicleDtoImageUrl).ToList();
            return Ok(result);
        }

        // Public endpoint - lấy chi tiết xe available (chỉ trả về nếu xe có status = "Available")
        [AllowAnonymous]
        [HttpGet("available/{id}")]
        public async Task<IActionResult> GetAvailableVehicleById(Guid id)
        {
            var vehicle = await _vehicleService.GetAvailableVehicleByIdAsync(id);
            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found or not available." });

            // Map ImageUrl với base URL của API
            MapVehicleDtoImageUrl(vehicle);
            return Ok(vehicle);
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
                return (true, null, Forbid("Tài khoản Staff chưa được gán trạm. Vui lòng liên hệ Admin để cập nhật trạm quản lý."));
            }

            return (true, stationId, null);
        }
    }
}
