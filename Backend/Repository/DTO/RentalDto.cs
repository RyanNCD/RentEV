using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.DTO
{
    public class RentalDto
    {
        public Guid RentalId { get; set; }

        public Guid? ContractId { get; set; }

        public Guid UserId { get; set; }

        public Guid VehicleId { get; set; }

        // Thêm tên xe để hiển thị lịch sử có ý nghĩa hơn
        public string? VehicleName { get; set; }
        
        // Thêm tên khách hàng
        public string? UserName { get; set; }
        
        // Thêm tên trạm
        public string? PickupStationName { get; set; }
        public string? ReturnStationName { get; set; }

        public Guid PickupStationId { get; set; }

        public Guid? ReturnStationId { get; set; }

        public Guid? StaffId { get; set; }

        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public decimal? TotalCost { get; set; }

        public decimal? PricePerDaySnapshot { get; set; }

        public string Status { get; set; }

        // Contract information
        public ContractDto? Contract { get; set; }

        // Early return request
        public bool EarlyReturnRequested { get; set; }
        public DateTime? EarlyReturnRequestedAt { get; set; }

        public DepositDto? Deposit { get; set; }

        public List<RentalPenaltyDto> Penalties { get; set; } = new List<RentalPenaltyDto>();
    }
}
