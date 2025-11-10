
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using System.Linq;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace APIRentEV.Controllers
{
    [Authorize]
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
            var dtos = new List<UserDto>();
            
            foreach (var user in users)
            {
                var dto = _mapper.Map<UserDto>(user);
                dto.IsBlacklisted = await _userService.IsUserBlacklistedAsync(user.UserId);
                dtos.Add(dto);
            }
            
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
            if (users == null || !users.Any())
            {
                // Debug: Trả về thông tin để kiểm tra
                var allRoles = await _userService.GetAllRolesAsync();
                return Ok(new 
                { 
                    message = "Không tìm thấy nhân viên",
                    searchedRole = "StaffStation",
                    availableRoles = allRoles.Select(r => r.RoleName).ToList(),
                    users = new List<UserDto>()
                });
            }
            var dtos = _mapper.Map<List<UserDto>>(users);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("customers")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetCustomerUsers()
        {
            var users = await _userService.GetCustomerUsersAsync();
            
            // Tối ưu: Lấy tất cả blacklisted user IDs một lần
            var blacklistedIds = await _userService.GetBlacklistedUserIdsAsync();
            
            var dtos = users.Select(user =>
            {
                var dto = _mapper.Map<UserDto>(user);
                dto.IsBlacklisted = blacklistedIds.Contains(user.UserId);
                return dto;
            }).ToList();
            
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetAllRoles()
        {
            var roles = await _userService.GetAllRolesAsync();
            var dtos = roles.Select(r => new RoleDto
            {
                RoleId = r.RoleId,
                RoleName = r.RoleName,
                Description = r.Description
            }).ToList();
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

            // Map các field từ DTO
            existing.FullName = dto.FullName ?? existing.FullName;
            existing.Phone = dto.Phone ?? existing.Phone;
            existing.IdentityCard = dto.IdentityCard ?? existing.IdentityCard;
            existing.DriverLicense = dto.DriverLicense ?? existing.DriverLicense;
            existing.RoleId = dto.RoleId != Guid.Empty ? dto.RoleId : existing.RoleId;
            
            // Xử lý password nếu có
            if (!string.IsNullOrEmpty(dto.PasswordHash))
            {
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash);
            }

            await _userService.UpdateUserAsync(id, existing);

            var userDto = _mapper.Map<UserDto>(existing);
            userDto.IsBlacklisted = await _userService.IsUserBlacklistedAsync(id);
            return Ok(userDto);
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

        [Authorize(Roles = "Admin")]
        [HttpPost("staffstation/{userId}/revoke")]
        public async Task<IActionResult> RevokeStaffRole(Guid userId)
        {
            var user = await _userService.RevokeStaffRoleAsync(userId);
            if (user == null) 
                return NotFound(new { message = "Không tìm thấy nhân viên hoặc không thể thu hồi quyền" });

            var userDto = _mapper.Map<UserDto>(user);
            userDto.IsBlacklisted = await _userService.IsUserBlacklistedAsync(userId);
            return Ok(userDto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/ban")]
        public async Task<IActionResult> BanUser(Guid id, [FromBody] BanUserDto dto)
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !Guid.TryParse(adminIdClaim, out var adminId))
            {
                return Unauthorized();
            }

            var user = await _userService.BanUserAsync(id, dto.Reason, adminId);
            if (user == null) return NotFound();

            var userDto = _mapper.Map<UserDto>(user);
            userDto.IsBlacklisted = await _userService.IsUserBlacklistedAsync(id);
            return Ok(userDto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateRoleDto dto)
        {
            var user = await _userService.UpdateUserRoleAsync(id, dto.RoleId);
            if (user == null) return NotFound();

            return Ok(_mapper.Map<UserDto>(user));
        }

    }

    public class UpdateRoleDto
    {
        public Guid RoleId { get; set; }
    }

    public class BanUserDto
    {
        public string Reason { get; set; }
    }
}
