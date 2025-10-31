using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;
using Service.Services;

namespace APIRentEV.Controllers
{
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

        // Lấy tất cả payment
        [HttpGet]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await _paymentService.GetAllPaymentsAsync();
            var dtos = _mapper.Map<List<PaymentDto>>(payments);
            return Ok(dtos);
        }

        // Lấy payment theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(Guid id)
        {
            var payment = await _paymentService.GetPaymentById(id);
            if (payment == null) return NotFound();

            var dto = _mapper.Map<PaymentDto>(payment);
            return Ok(dto);
        }

        // Tạo payment mới và trả URL thanh toán VNPAY
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var payment = _mapper.Map<Payment>(dto);

            // Lấy IP người dùng từ HttpContext
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // Truyền đủ tham số
            var paymentUrl = await _paymentService.CreatePaymentUrlAsync(payment.Amount, payment.PaymentId, ipAddress);

            return Ok(new { paymentUrl });
        }


        // Callback VNPAY
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            // Request.Query là IQueryCollection, convert sang Dictionary
            var queryParams = new Dictionary<string, string>();
            foreach (var key in Request.Query.Keys)
            {
                queryParams[key] = Request.Query[key];
            }

            var result = await _paymentService.HandleVnPayReturnAsync(queryParams);

            // Trả message cho frontend hoặc redirect nếu muốn
            return Ok(new { message = result });
        }
    }
}
