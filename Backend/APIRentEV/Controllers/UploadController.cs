using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.Models;
using Service.Interface;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace APIRentEV.Controllers
{
    [Authorize(Roles = "StaffStation")]
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IRentalImageService _imageService;
        private readonly IWebHostEnvironment _env;

        public UploadController(IRentalImageService imageService, IWebHostEnvironment env)
        {
            _imageService = imageService;
            _env = env;
        }

        [HttpGet("rental-image/{rentalId}")]
        public async Task<IActionResult> GetRentalImages(Guid rentalId)
        {
            var images = await _imageService.GetByRentalIdAsync(rentalId);
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var result = images.Select(i => new {
                imageId = i.ImageId,
                rentalId = i.RentalId,
                imageUrl = string.IsNullOrWhiteSpace(i.ImageUrl) ? null : $"{baseUrl}{i.ImageUrl}",
                type = i.Type,
                description = i.Description,
                note = i.Note,
                createdAt = i.CreatedAt
            });
            return Ok(result);
        }

        [HttpPost("rental-image")]
        public async Task<IActionResult> UploadRentalImage(
            [FromForm] IFormFile file,
            [FromForm] Guid? rentalId,
            [FromForm] string? type,
            [FromForm] string? description,
            [FromForm] string? note)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Định dạng ảnh không hợp lệ. Chỉ cho phép JPG/PNG/WebP." });

            const long maxSizeBytes = 5 * 1024 * 1024; // 5MB
            if (file.Length > maxSizeBytes)
                return BadRequest(new { message = "Kích thước ảnh vượt quá 5MB." });

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var folder = rentalId.HasValue ? rentalId.Value.ToString() : "misc";
            var uploadDir = Path.Combine(webRoot, "uploads", "rentals", folder);
            Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(uploadDir, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/rentals/{folder}/{fileName}";
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var absoluteUrl = $"{baseUrl}{url}";

            if (rentalId.HasValue)
            {
                var image = new RentalImage
                {
                    ImageId = Guid.NewGuid(),
                    RentalId = rentalId.Value,
                    // Lưu đường dẫn tương đối trong DB để tránh phụ thuộc domain
                    ImageUrl = url,
                    Type = string.IsNullOrWhiteSpace(type) ? "Unknown" : type,
                    Description = description,
                    Note = note,
                    CreatedAt = DateTime.UtcNow
                };
                await _imageService.AddAsync(image);
            }

            // Trả về URL tuyệt đối cho phía client (kèm domain API)
            return Ok(new { url = absoluteUrl });
        }

        [HttpPost("vehicle-image")]
        public async Task<IActionResult> UploadVehicleImage(
            [FromForm] IFormFile file,
            [FromForm] Guid? vehicleId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Định dạng ảnh không hợp lệ. Chỉ cho phép JPG/PNG/WebP." });

            const long maxSizeBytes = 5 * 1024 * 1024; // 5MB
            if (file.Length > maxSizeBytes)
                return BadRequest(new { message = "Kích thước ảnh vượt quá 5MB." });

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var folder = vehicleId.HasValue ? vehicleId.Value.ToString() : "misc";
            var uploadDir = Path.Combine(webRoot, "uploads", "vehicles", folder);
            Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(uploadDir, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/vehicles/{folder}/{fileName}";
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var absoluteUrl = $"{baseUrl}{url}";

            // Trả về URL tuyệt đối cho phía client (kèm domain API)
            return Ok(new { url = absoluteUrl });
        }
    }
}