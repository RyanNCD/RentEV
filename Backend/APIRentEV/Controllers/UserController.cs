
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Services;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;

        public UsersController(IUserService userService, IMapper mapper)
        {
            _userService = userService;
            _mapper = mapper;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersAll()
        {
            var users = await _userService.GetAllUsersAsync();
            var dtos = _mapper.Map<List<UserDto>>(users);
            return Ok(dtos);
        }

        // GET: api/Users/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound();

            return Ok(_mapper.Map<UserDto>(user));
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] UserCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            var user = _mapper.Map<User>(dto);
            var created = await _userService.CreateUserAsync(user);

            return CreatedAtAction(nameof(GetUserById),
                                   new { id = created.UserId },
                                   _mapper.Map<UserDto>(created));
        }

        // PUT: api/Users/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UserUpdateDto dto)
        {
            var existing = await _userService.GetUserByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing); // AutoMapper map các field không null
            await _userService.UpdateUserAsync(id, existing);

            return Ok(_mapper.Map<UserDto>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var success = await _userService.DeleteUserAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
