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

        // Get penalty by ID
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
    }
}

