using System;
using System.ComponentModel.DataAnnotations;

namespace Repository.Models;

public class UserOtp
{
    [Key]
    public Guid UserOtpId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [StringLength(20)]
    public string Purpose { get; set; }

    [Required]
    [StringLength(255)]
    public string CodeHash { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; }
}



