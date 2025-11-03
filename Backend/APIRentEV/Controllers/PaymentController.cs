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

        public PaymentController(IPaymentService paymentService, IMapper mapper)
        {
            _paymentService = paymentService;
            _mapper = mapper;
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

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // CreatePaymentUrlAsync now saves the payment with "Pending" status
            var paymentUrl = await _paymentService.CreatePaymentUrlAsync(payment, ipAddress);

            return Ok(new { paymentUrl, paymentId = payment.PaymentId });
        }


        [AllowAnonymous]
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            try
            {
                // Request.Query là IQueryCollection, convert sang Dictionary
                var queryParams = new Dictionary<string, string>();
                foreach (var key in Request.Query.Keys)
                {
                    queryParams[key] = Request.Query[key];
                }

                // Process the VnPay return and save/update payment
                var payment = await _paymentService.ProcessVnPayReturnAsync(queryParams);

                // Return success message with payment info
                return Ok(new 
                { 
                    success = true,
                    message = payment.Status == "Success" ? "Payment successful" : "Payment failed",
                    paymentId = payment.PaymentId,
                    status = payment.Status,
                    amount = payment.Amount
                });
            }
            catch (Exception ex)
            {
                // Return error message if validation or processing fails
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
