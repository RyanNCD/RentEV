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
            var result = await _authenService.LoginAsync(loginDto.Email, loginDto.Password, loginDto.DeviceId);
            if (result == null)
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            if (result.Success)
            {
                return Ok(result);
            }

            if (result.RequiresOtp)
            {
                return Ok(result);
            }

            if (result.RequiresEmailVerification)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }

            return Unauthorized(result);
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto model)
        {
            try
            {
                var user = await _authenService.RegisterAsync(model);

                return Ok(new
                {
                    message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
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

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto dto)
        {
            try
            {
                var result = await _authenService.VerifyOtpAsync(dto.OtpRequestId, dto.Code, dto.RememberDevice, dto.DeviceId);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto dto)
        {
            try
            {
                await _authenService.VerifyEmailAsync(dto.Token);
                return Ok(new { message = "Email đã được xác thực thành công." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("resend-email-verification")]
        public async Task<IActionResult> ResendEmailVerification([FromBody] ResendVerificationRequestDto dto)
        {
            try
            {
                await _authenService.ResendVerificationEmailAsync(dto.Email);
                return Ok(new { message = "Đã gửi lại email xác thực." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
