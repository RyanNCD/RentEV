using Microsoft.EntityFrameworkCore;

namespace Repository.Models;

public partial class SWP391RentEVContext
{
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.IsEmailVerified).HasDefaultValue(false);
            entity.Property(e => e.EmailVerificationToken).HasMaxLength(255);
            entity.Property(e => e.TrustedDeviceHash).HasMaxLength(255);
        });

        modelBuilder.Entity<UserOtp>(entity =>
        {
            entity.HasKey(e => e.UserOtpId).HasName("PK_UserOtp");

            entity.ToTable("UserOtp");

            entity.Property(e => e.UserOtpId).HasDefaultValueSql("(UUID())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Purpose)
                .IsRequired()
                .HasMaxLength(20);
            entity.Property(e => e.CodeHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasOne(d => d.User)
                .WithMany(p => p.UserOtps)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_UserOtp_User");
        });
    }
}

