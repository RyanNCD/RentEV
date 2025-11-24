using System;

namespace Repository.DTO
{
    public class VerifyOtpRequestDto
    {
        public Guid OtpRequestId { get; set; }

        public string Code { get; set; }

        public bool RememberDevice { get; set; }

        public string? DeviceId { get; set; }
    }
}

