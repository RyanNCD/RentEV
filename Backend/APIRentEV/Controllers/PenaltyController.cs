using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Repositories;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PenaltyController : ControllerBase
    {
        private readonly Repository.Models.SWP391RentEVContext _context;
        private readonly ILogger<PenaltyController> _logger;

        public PenaltyController(Repository.Models.SWP391RentEVContext context, ILogger<PenaltyController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Get all active penalties (public - customers need to see penalty rates)
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PenaltyDto>>> GetPenalties()
        {
            var penalties = await _context.Penalties
                .Where(p => p.IsActive)
                .OrderBy(p => p.ViolationType)
                .ToListAsync();

            var dtos = penalties.Select(p => new PenaltyDto
            {
                PenaltyId = p.PenaltyId,
                ViolationType = p.ViolationType,
                Description = p.Description,
                Amount = p.Amount,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return Ok(dtos);
        }

        // Get penalty by ID (public, for display)
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<PenaltyDto>> GetPenalty(Guid id)
        {
            var penalty = await _context.Penalties.FindAsync(id);
            if (penalty == null)
            {
                return NotFound();
            }

            var dto = new PenaltyDto
            {
                PenaltyId = penalty.PenaltyId,
                ViolationType = penalty.ViolationType,
                Description = penalty.Description,
                Amount = penalty.Amount,
                IsActive = penalty.IsActive,
                CreatedAt = penalty.CreatedAt,
                UpdatedAt = penalty.UpdatedAt
            };

            return Ok(dto);
        }

        // === ADMIN CRUD ===

        // Create new penalty
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<PenaltyDto>> CreatePenalty([FromBody] PenaltyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ViolationType))
            {
                return BadRequest(new { message = "Loại vi phạm không được để trống." });
            }

            if (dto.Amount <= 0)
            {
                return BadRequest(new { message = "Số tiền phạt phải lớn hơn 0." });
            }

            // Ensure unique violation type
            var exists = await _context.Penalties
                .AnyAsync(p => p.ViolationType == dto.ViolationType);
            if (exists)
            {
                return BadRequest(new { message = "Mỗi loại vi phạm chỉ được cấu hình một mức phạt. Vui lòng chọn loại khác hoặc sửa mức phạt hiện có." });
            }

            var entity = new Penalty
            {
                PenaltyId = dto.PenaltyId != Guid.Empty ? dto.PenaltyId : Guid.NewGuid(),
                ViolationType = dto.ViolationType,
                Description = dto.Description,
                Amount = dto.Amount,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Penalties.Add(entity);
            await _context.SaveChangesAsync();

            dto.PenaltyId = entity.PenaltyId;
            dto.CreatedAt = entity.CreatedAt;
            dto.UpdatedAt = entity.UpdatedAt;

            return CreatedAtAction(nameof(GetPenalty), new { id = entity.PenaltyId }, dto);
        }

        // Update existing penalty
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<PenaltyDto>> UpdatePenalty(Guid id, [FromBody] PenaltyDto dto)
        {
            var penalty = await _context.Penalties.FindAsync(id);
            if (penalty == null)
            {
                return NotFound(new { message = "Không tìm thấy mức phạt." });
            }

            if (string.IsNullOrWhiteSpace(dto.ViolationType))
            {
                return BadRequest(new { message = "Loại vi phạm không được để trống." });
            }

            if (dto.Amount <= 0)
            {
                return BadRequest(new { message = "Số tiền phạt phải lớn hơn 0." });
            }

            // Ensure unique violation type (exclude current record)
            var exists = await _context.Penalties
                .AnyAsync(p => p.PenaltyId != id && p.ViolationType == dto.ViolationType);
            if (exists)
            {
                return BadRequest(new { message = "Đã tồn tại mức phạt cho loại vi phạm này. Vui lòng chọn loại khác hoặc chỉnh sửa bản ghi hiện có." });
            }

            penalty.ViolationType = dto.ViolationType;
            penalty.Description = dto.Description;
            penalty.Amount = dto.Amount;
            penalty.IsActive = dto.IsActive;
            penalty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            dto.PenaltyId = penalty.PenaltyId;
            dto.CreatedAt = penalty.CreatedAt;
            dto.UpdatedAt = penalty.UpdatedAt;

            return Ok(dto);
        }

        // Soft delete / deactivate penalty
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePenalty(Guid id)
        {
            var penalty = await _context.Penalties.FindAsync(id);
            if (penalty == null)
            {
                return NotFound(new { message = "Không tìm thấy mức phạt." });
            }

            // Soft delete: đánh dấu không còn hoạt động
            penalty.IsActive = false;
            penalty.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

