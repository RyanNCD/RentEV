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

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await _paymentService.GetAllPaymentsAsync();
            var dtos = _mapper.Map<List<PaymentDto>>(payments);
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(Guid id)
        {
            var payment = await _paymentService.GetPaymentById(id);
            if (payment == null) return NotFound();

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
    }
}
