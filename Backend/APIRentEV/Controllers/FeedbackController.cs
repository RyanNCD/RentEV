using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;
        private readonly IMapper _mapper;

        public FeedbackController(IFeedbackService feedbackService, IMapper mapper)
        {
            _feedbackService = feedbackService;
            _mapper = mapper;
        }

        // GET: api/Feedback
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetAllFeedback()
        {
            var feedbacks = await _feedbackService.GetAllAsync();
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        // GET: api/Feedback/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<FeedbackDto>> GetFeedbackById(Guid id)
        {
            var feedback = await _feedbackService.GetByIdAsync(id);
            if (feedback == null) return NotFound();

            return Ok(_mapper.Map<FeedbackDto>(feedback));
        }

        // GET: api/Feedback/rental/{rentalId}
        [HttpGet("rental/{rentalId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetByRentalId(Guid rentalId)
        {
            var feedbacks = await _feedbackService.GetByRentalIdAsync(rentalId);
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        // GET: api/Feedback/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetByUserId(Guid userId)
        {
            var feedbacks = await _feedbackService.GetByUserIdAsync(userId);
            return Ok(_mapper.Map<List<FeedbackDto>>(feedbacks));
        }

        // POST: api/Feedback
        [HttpPost]
        public async Task<ActionResult<FeedbackDto>> CreateFeedback([FromBody] FeedbackCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var feedback = _mapper.Map<Feedback>(dto);
            var created = await _feedbackService.AddAsync(feedback);

            return CreatedAtAction(nameof(GetFeedbackById),
                                   new { id = created.FeedbackId },
                                   _mapper.Map<FeedbackDto>(created));
        }

        // Xóa feedback
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(Guid id)
        {
            var success = await _feedbackService.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }

        [HttpGet("rental/{rentalId}/average")]
        public async Task<IActionResult> GetAverage(Guid rentalId)
        {
            var avg = await _feedbackService.GetAverageRatingByRentalAsync(rentalId);
            return Ok(avg);
        }
    }
}
