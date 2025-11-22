using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Service.Interface;

namespace APIRentEV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenController : ControllerBase
    {
        private readonly IAuthenService _authenService;

        public AuthenController(IAuthenService authenService)
        {
            _authenService = authenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var token = await _authenService.LoginWithToken(loginDto.Email, loginDto.Password);
            if (token == null)
                return Unauthorized(new { message = "Invalid credentials." });

            return Ok(new { token });
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto model)
        {
            try
            {
                var user = await _authenService.RegisterAsync(model);

                return Ok(new
                {
                    message = "Register successfully",
                    data = new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.Phone,
                        user.IdentityCard,
                        user.DriverLicense,
                        user.RoleId
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", detail = ex.Message });
            }
        }
    }
}
