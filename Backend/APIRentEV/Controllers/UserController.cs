
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
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

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersAll()
        {
            var users = await _userService.GetAllUsersAsync();
            var dtos = _mapper.Map<List<UserDto>>(users);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound();

            return Ok(_mapper.Map<UserDto>(user));
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("staffstation")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetStaffStationUsers()
        {
            var users = await _userService.GetStaffStationUsersAsync();
            var dtos = _mapper.Map<List<UserDto>>(users);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UserUpdateDto dto)
        {
            var existing = await _userService.GetUserByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing); // AutoMapper map các field không null
            await _userService.UpdateUserAsync(id, existing);

            return Ok(_mapper.Map<UserDto>(existing));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var success = await _userService.DeleteUserAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("staffstation/{userId}")]
        public async Task<IActionResult> DeleteStaffStationUser(Guid userId)
        {
            var result = await _userService.DeleteStaffStationUserAsync(userId);
            if (!result)
                return NotFound();

            return NoContent();
        }

    }
}
