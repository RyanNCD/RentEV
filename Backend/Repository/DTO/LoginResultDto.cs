using System;

namespace Repository.DTO
{
    public class LoginResultDto
    {
        public bool Success { get; set; }

        public string? Token { get; set; }

        public bool RequiresEmailVerification { get; set; }

        public bool RequiresOtp { get; set; }

        public Guid? OtpRequestId { get; set; }

        public string? Message { get; set; }

        public bool TrustedDeviceUsed { get; set; }
    }
}

