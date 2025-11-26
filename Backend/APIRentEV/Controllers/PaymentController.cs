using APIRentEV.Extensions;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using Service.Services;
using System.Linq;
using System.Security.Claims;

namespace APIRentEV.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService; // dùng interface thay vì class cụ thể
        private readonly IMapper _mapper;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IPaymentService paymentService, IMapper mapper, ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _mapper = mapper;
            _logger = logger;
        }

        [Authorize(Roles = "StaffStation")]
        [HttpGet]
        public async Task<IActionResult> GetAllPayments()
        {
            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }

            var payments = await _paymentService.GetAllPaymentsAsync();
            if (isStaff && staffStationId.HasValue)
            {
                payments = payments
                    .Where(p => p.Rental != null && RentalMatchesStation(p.Rental, staffStationId.Value))
                    .ToList();
            }
            var dtos = _mapper.Map<List<PaymentDto>>(payments);
            return Ok(dtos);
        }

        [Authorize(Roles = "StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(Guid id)
        {
            var payment = await _paymentService.GetPaymentById(id);
            if (payment == null) return NotFound();

            var (isStaff, staffStationId, stationError) = ResolveStaffContext();
            if (stationError != null)
            {
                return stationError;
            }
            if (isStaff && staffStationId.HasValue && payment.Rental != null && !RentalMatchesStation(payment.Rental, staffStationId.Value))
            {
                return Forbid("Bạn chỉ có thể xem giao dịch thuộc trạm của mình.");
            }

            var dto = _mapper.Map<PaymentDto>(payment);
            return Ok(dto);
        }

        [Authorize(Roles = "Customer")]
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var payment = _mapper.Map<Payment>(dto);
            _logger.LogInformation("[PayOS] CreatePayment requested for RentalId={RentalId}, UserId={UserId}, Amount={Amount}", payment.RentalId, payment.UserId, payment.Amount);

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // CreatePaymentUrlAsync now saves the payment with "Pending" status
            var checkoutUrl = await _paymentService.CreatePaymentUrlAsync(payment, ipAddress);
            _logger.LogInformation("[PayOS] CheckoutUrl created for PaymentId={PaymentId}", payment.PaymentId);

            return Ok(new { checkoutUrl, paymentId = payment.PaymentId, transactionId = payment.TransactionId });
        }


        [AllowAnonymous]
        [HttpPost("payos/webhook")]
        public async Task<IActionResult> PayOSWebhook()
        {
            // Đọc body thô và xác minh bằng SDK PayOS qua service
            try
            {
                using var reader = new StreamReader(Request.Body);
                var rawBody = await reader.ReadToEndAsync();
                var webhookData = await _paymentService.VerifyPayOSWebhookAsync(rawBody);
                _logger.LogInformation("[PayOS] Webhook verified: orderCode={OrderCode}, paymentLinkId={PaymentLinkId}, code={Code}, desc={Desc}",
                    webhookData.orderCode, webhookData.paymentLinkId, webhookData.code, webhookData.desc);
                return Ok(new { success = true });
            }
            catch (Exception ex)
                {
                _logger.LogError(ex, "[PayOS] Webhook verification error");
                return BadRequest(new { success = false, message = ex.Message });
            }
                }

        [Authorize(Roles = "Customer")]
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmPayment(Guid id)
                { 
            _logger.LogInformation("[ConfirmPayment] Request received for paymentId={PaymentId}", id);
            var payment = await _paymentService.ConfirmPaymentAsync(id);
            if (payment == null)
            {
                _logger.LogWarning("[ConfirmPayment] Payment not found or cannot confirm. paymentId={PaymentId}", id);
                return NotFound(new { message = "Payment not found." });
            }
            _logger.LogInformation("[ConfirmPayment] Payment confirmed. paymentId={PaymentId}, transactionId={TransactionId}", payment.PaymentId, payment.TransactionId);
            var dto = _mapper.Map<PaymentDto>(payment);
            return Ok(dto);
        }

        // === STATION PAYMENT ===
        // Staff tạo payment link PayOS tại trạm cho khách
        [Authorize(Roles = "StaffStation")]
        [HttpPost("station/create-payos")]
        public async Task<IActionResult> CreateStationPayOSPayment([FromBody] CreateStationPayOSPaymentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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

            try
            {
                // Verify rental belongs to staff's station
                var rentalService = HttpContext.RequestServices.GetRequiredService<Service.Interface.IRentalService>();
                var rental = await rentalService.GetRentalByIdAsync(dto.RentalId);
                if (rental == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn thuê." });
                }
                if (rental.PickupStationId != staffStationId.Value)
                {
                    return Forbid("Bạn chỉ có thể tạo thanh toán cho đơn thuê tại trạm của mình.");
                }

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var checkoutUrl = await _paymentService.CreateStationPayOSPaymentAsync(dto.RentalId, staffId, ipAddress);
                
                _logger.LogInformation("[StationPayOS] Payment link created for RentalId={RentalId} by StaffId={StaffId}", dto.RentalId, staffId);
                
                return Ok(new { checkoutUrl, rentalId = dto.RentalId });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StationPayOS] Error creating payment link");
                return StatusCode(500, new { message = "Lỗi khi tạo link thanh toán." });
            }
        }

        // Staff xác nhận thanh toán tại trạm (Cash hoặc BankTransfer)
        [Authorize(Roles = "StaffStation")]
        [HttpPost("station/confirm")]
        public async Task<IActionResult> ConfirmStationPayment([FromBody] StationPaymentCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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

            try
            {
                // Verify rental belongs to staff's station
                var rentalService = HttpContext.RequestServices.GetRequiredService<Service.Interface.IRentalService>();
                var rental = await rentalService.GetRentalByIdAsync(dto.RentalId);
                if (rental == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn thuê." });
                }
                if (rental.PickupStationId != staffStationId.Value)
                {
                    return Forbid("Bạn chỉ có thể xác nhận thanh toán cho đơn thuê tại trạm của mình.");
                }

                var payment = await _paymentService.ConfirmStationPaymentAsync(
                    dto.RentalId, 
                    dto.PaymentMethod, 
                    staffId, 
                    dto.PaymentProofImageUrl);

                _logger.LogInformation("[StationPayment] Payment confirmed for RentalId={RentalId}, Method={Method} by StaffId={StaffId}", 
                    dto.RentalId, dto.PaymentMethod, staffId);

                var paymentDto = _mapper.Map<PaymentDto>(payment);
                return Ok(paymentDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StationPayment] Error confirming payment");
                return StatusCode(500, new { message = "Lỗi khi xác nhận thanh toán." });
            }
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
