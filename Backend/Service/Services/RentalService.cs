using Repository.DTO;
using Repository.Implementations;
using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Services
{
    public class RentalService : IRentalService
    {
        private readonly RentalRepository _rentalRepo;
        private readonly VehicleRepository _vehicleRepo;
        private readonly IRentalImageService _imageService;
        private readonly IContractService _contractService;
        private readonly DepositRepository _depositRepo;
        private readonly RentalPenaltyRepository _rentalPenaltyRepo;
     

        public RentalService(RentalRepository rentalRepo,
                             VehicleRepository vehicleRepo,
                             IRentalImageService imageService,
                             IContractService contractService,
                             DepositRepository depositRepo,
                             RentalPenaltyRepository rentalPenaltyRepo)
        {
            _rentalRepo = rentalRepo;
            _vehicleRepo = vehicleRepo;
            _imageService = imageService;
            _contractService = contractService;
            _depositRepo = depositRepo;
            _rentalPenaltyRepo = rentalPenaltyRepo;
        }

        public async Task<IEnumerable<Rental>> GetAllRentalAsync()
        {
            return await _rentalRepo.GetAllAsync();
        }
        public async Task<IEnumerable<Rental>> GetPaidRentalsAsync()
        {
            return await _rentalRepo.GetAllPaidAsync();
        }
        public async Task<IEnumerable<Rental>> GetReadyForHandoverAsync()
        {
            return await _rentalRepo.GetAllReadyForHandoverAsync();
        }
        public async Task<Rental> CreateRentalAsync(Rental rental)
        {
            // Validation thời gian đặt xe
            if (rental.StartTime.HasValue && rental.EndTime.HasValue)
            {
                var startTime = rental.StartTime.Value;
                var endTime = rental.EndTime.Value;

                // Kiểm tra thời gian hợp lệ
                if (endTime <= startTime)
                {
                    throw new InvalidOperationException("Thời gian kết thúc phải sau thời gian bắt đầu.");
                }

                // Tính số giờ thuê
                var totalHours = (endTime - startTime).TotalHours;

                // Tối thiểu 24 giờ
                if (totalHours < 24)
                {
                    throw new InvalidOperationException("Thời gian thuê xe tối thiểu là 24 giờ.");
                }

                // Kiểm tra conflict với các rental đã thanh toán
                // Chỉ kiểm tra các rental đã thanh toán (có payment thành công) hoặc có status PAID, BOOKING, IN_PROGRESS
                // Bỏ qua các rental chưa thanh toán (PENDING và không có payment thành công)
                var hasConflict = await _rentalRepo.HasConflictingRentalsAsync(rental.VehicleId, startTime, endTime, rental.RentalId);

                if (hasConflict)
                {
                    // Lấy thông tin rental conflict để hiển thị thời gian
                    var existingRentals = await _rentalRepo.GetAllAsync();
                    var conflictRental = existingRentals
                        .Where(r => r.VehicleId == rental.VehicleId
                            && r.StartTime.HasValue
                            && r.EndTime.HasValue
                            && r.RentalId != rental.RentalId
                            // Chỉ kiểm tra các rental chưa completed
                            && (r.Status == null || r.Status.ToUpper() != "COMPLETED")
                            && (
                                (r.Payments != null && r.Payments.Any(p => p.Status != null && p.Status.ToUpper() == "SUCCESS"))
                                ||
                                (r.Status != null && (
                                    r.Status.ToUpper() == "PAID" 
                                    || r.Status.ToUpper() == "BOOKING" 
                                    || r.Status.ToUpper() == "IN_PROGRESS"
                                ))
                            )
                            && (startTime < r.EndTime.Value && endTime > r.StartTime.Value)
                        )
                        .FirstOrDefault();
                    
                    if (conflictRental != null)
                    {
                        var conflictStart = conflictRental.StartTime?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
                        var conflictEnd = conflictRental.EndTime?.ToString("dd/MM/yyyy HH:mm") ?? "N/A";
                        throw new InvalidOperationException(
                            $"Xe đã được đặt trong khoảng thời gian này. " +
                            $"Thời gian đã đặt: {conflictStart} - {conflictEnd}. " +
                            $"Vui lòng chọn thời gian khác hoặc chọn xe khác."
                        );
                    }
                    else
                    {
                        throw new InvalidOperationException(
                            "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác hoặc chọn xe khác."
                        );
                    }
                }

                // Tính số ngày: nếu > 24h thì tính là ngày thứ 2
                var totalDays = Math.Ceiling(totalHours / 24.0);
                
                // Tính tổng tiền nếu có vehicle
                if (rental.VehicleId != Guid.Empty)
                {
                    var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
                    if (vehicle != null && vehicle.PricePerDay.HasValue)
                    {
                        rental.PricePerDaySnapshot = vehicle.PricePerDay.Value;
                        rental.TotalCost = (decimal)totalDays * rental.PricePerDaySnapshot.Value;
                    }
                }
            }

            rental.RentalId = Guid.NewGuid();
            rental.CreatedAt = DateTime.UtcNow;

            await _rentalRepo.AddAsync(rental);

            // Số người đã thuê xe sẽ được tăng khi tạo reservation, không tăng ở đây

            return rental;
        }


        public async Task<Rental?> UpdateRentalAsync(Guid id, Rental rental)
        {
            if (rental == null)
                throw new ArgumentNullException(nameof(rental));

            // Lấy dữ liệu hiện có trong DB
            var existingRental = await _rentalRepo.GetByIdAsync(id);
            if (existingRental == null)
                throw new KeyNotFoundException($"Rental with ID {id} not found");

            // Cập nhật các trường cho phép sửa
            existingRental.ContractId = rental.ContractId;
            existingRental.UserId = rental.UserId;
            existingRental.VehicleId = rental.VehicleId;
            existingRental.PickupStationId = rental.PickupStationId;
            existingRental.ReturnStationId = rental.ReturnStationId;
            existingRental.StaffId = rental.StaffId;
            existingRental.StartTime = rental.StartTime;
            existingRental.EndTime = rental.EndTime;
            existingRental.TotalCost = rental.TotalCost;
            existingRental.Status = rental.Status;

            await _rentalRepo.UpdateAsync(existingRental);
            return existingRental;
        }



        public async Task<Rental?> GetRentalByIdAsync(Guid id)
        {
            return await _rentalRepo.GetByIdAsync(id);
        }
        public async Task<Rental?> GetPaidRentalByIdAsync(Guid id)
        {
            return await _rentalRepo.GetPaidByIdAsync(id);
        }

        public async Task<bool> CancelRentalAsync(Guid rentalId)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
                throw new KeyNotFoundException($"Rental with ID {rentalId} not found.");

            if (rental.Status == "Cancelled")
                throw new InvalidOperationException("This rental has already been cancelled.");

            // Cập nhật trạng thái thuê
            var result = await _rentalRepo.CancelRentalAsync(rentalId);

            // Cập nhật lại trạng thái xe (nếu xe đang bị giữ)
            if (result)
            {
                var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
                if (vehicle != null)
                {
                    // Check if there are other active rentals for this vehicle
                    var allRentals = await _rentalRepo.GetAllAsync();
                    var hasOtherActiveRentals = allRentals
                        .Any(r => r.VehicleId == rental.VehicleId && 
                                 r.RentalId != rentalId && 
                                 r.Status != null && 
                                 r.Status.ToUpper() == "IN_PROGRESS");
                    
                    if (!hasOtherActiveRentals)
                    {
                        // Check if there are reserved rentals
                        var hasReservedRental = allRentals
                            .Any(r => r.VehicleId == rental.VehicleId && 
                                     r.Status != null && 
                                     (r.Status.ToUpper() == "PAID" || r.Status.ToUpper() == "BOOKING"));
                        
                        if (hasReservedRental)
                        {
                            vehicle.Status = "Reserved";
                        }
                        else if (vehicle.Status == null || 
                                 (vehicle.Status.ToUpper() != "MAINTENANCE" && vehicle.Status.ToUpper() != "UNAVAILABLE"))
                        {
                            vehicle.Status = "Available";
                        }
                        await _vehicleRepo.UpdateAsync(vehicle);
                    }
                }
            }

            return result;
        }

        public async Task<IEnumerable<Rental>> GetRentalsByUserAsync(Guid userId)
        {
            return await _rentalRepo.GetByUserIdAsync(userId);
        }
        public async Task<IEnumerable<Rental>> GetPaidRentalsByUserAsync(Guid userId)
        {
            return await _rentalRepo.GetPaidByUserIdAsync(userId);
        }

        public async Task<Rental?> CheckInAsync(Guid rentalId, Guid staffId, DateTime deliveredAt, string? deliveryCondition)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null) return null;

            // Kiểm tra thời gian bàn giao: được phép bàn giao từ 1 giờ trước thời gian bắt đầu đến trước thời gian kết thúc
            // Ví dụ: Hẹn 10:00 27/11/2025 - 10:00 28/11/2025 thì được bàn giao từ 09:00 27/11/2025 đến trước 10:00 28/11/2025
            if (rental.StartTime.HasValue)
            {
                var earliestDeliveryTime = rental.StartTime.Value.AddHours(-1);
                
                // Không được bàn giao quá sớm (trước 1 giờ trước thời gian bắt đầu)
                if (deliveredAt < earliestDeliveryTime)
                {
                    throw new InvalidOperationException($"Không thể bàn giao xe quá sớm. Chỉ được phép bàn giao từ {earliestDeliveryTime:dd/MM/yyyy HH:mm} (1 giờ trước thời gian bắt đầu {rental.StartTime.Value:dd/MM/yyyy HH:mm}). Thời gian hiện tại: {deliveredAt:dd/MM/yyyy HH:mm}.");
                }
            }
            
            // Không được bàn giao sau thời gian kết thúc
            if (rental.EndTime.HasValue && deliveredAt >= rental.EndTime.Value)
            {
                throw new InvalidOperationException($"Không thể bàn giao xe sau thời gian kết thúc ({rental.EndTime.Value:dd/MM/yyyy HH:mm}). Thời gian hiện tại: {deliveredAt:dd/MM/yyyy HH:mm}.");
            }

            // Create Contract if not exists
            if (!rental.ContractId.HasValue)
            {
                var startDate = rental.StartTime ?? deliveredAt;
                var endDate = rental.EndTime ?? deliveredAt.AddDays(1);
                var vehicleName = rental.Vehicle?.VehicleName ?? "";
                
                var contract = new Contract
                {
                    UserId = rental.UserId,
                    VehicleId = rental.VehicleId,
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalAmount = rental.TotalCost,
                    Terms = $"Hợp đồng thuê xe {vehicleName} từ {startDate:dd/MM/yyyy} đến {endDate:dd/MM/yyyy}. Tổng tiền: {rental.TotalCost?.ToString("N0") ?? "0"} VNĐ.",
                    Status = "Active"
                };

                var createdContract = await _contractService.CreateAsync(contract);
                rental.ContractId = createdContract.ContractId;
            }

            rental.DeliveredAt = deliveredAt;
            rental.DeliveredByStaffId = staffId;
            rental.DeliveryCondition = deliveryCondition;
            rental.Status = "IN_PROGRESS";

            await _rentalRepo.UpdateAsync(rental);
            
            // Update vehicle status to Rented
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
            if (vehicle != null)
            {
                vehicle.Status = "Rented";
                await _vehicleRepo.UpdateAsync(vehicle);
            }
            
            // Reload rental with Contract included
            var updatedRental = await _rentalRepo.GetByIdAsync(rentalId);
            return updatedRental;
        }

        public async Task<Rental?> RequestEarlyReturnAsync(Guid rentalId, Guid userId)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null) return null;

            // Verify rental belongs to user
            if (rental.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền yêu cầu trả xe sớm cho đơn thuê này.");
            }

            // Only allow request when rental is in progress
            if (!string.Equals(rental.Status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Chỉ có thể yêu cầu trả xe sớm khi đơn thuê đang trong trạng thái đang thuê.");
            }

            // Check if returning early (before EndTime)
            if (rental.EndTime.HasValue && DateTime.UtcNow < rental.EndTime.Value)
            {
                rental.EarlyReturnRequested = true;
                rental.EarlyReturnRequestedAt = DateTime.UtcNow;
                await _rentalRepo.UpdateAsync(rental);
            }
            else
            {
                // If not early return, just allow normal return
                rental.EarlyReturnRequested = true;
                rental.EarlyReturnRequestedAt = DateTime.UtcNow;
                await _rentalRepo.UpdateAsync(rental);
            }

            return rental;
        }

        public async Task<Rental?> CheckOutAsync(Guid rentalId, Guid staffId, DateTime receivedAt, string? returnCondition)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null) return null;

            // Only allow check-out when rental is in progress
            if (!string.Equals(rental.Status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Rental không ở trạng thái đang thuê, không thể nhận xe.");
            }

            // Check if returning early (before EndTime)
            bool isEarlyReturn = rental.EndTime.HasValue && receivedAt < rental.EndTime.Value;
            
            // If early return, require customer's request
            if (isEarlyReturn && !rental.EarlyReturnRequested)
            {
                throw new InvalidOperationException("Không thể nhận xe trước thời hạn mà không có yêu cầu từ khách hàng. Vui lòng yêu cầu khách hàng xác nhận trả xe sớm trước.");
            }

            rental.ReceivedAt = receivedAt;
            rental.ReceivedByStaffId = staffId;
            rental.ReturnCondition = returnCondition;
            // KHÔNG set status = "COMPLETED" ở đây
            // Giữ status = "IN_PROGRESS" để user có thể xác nhận trả xe
            // Status sẽ được set thành "COMPLETED" khi user gọi confirmReturn

            await _rentalRepo.UpdateAsync(rental);
            
            // Update vehicle status based on other rentals
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(rental.VehicleId);
            if (vehicle != null)
            {
                // Check if there are other active rentals for this vehicle
                var hasOtherActiveRentals = await _rentalRepo.GetAllAsync();
                var otherActiveRental = hasOtherActiveRentals
                    .FirstOrDefault(r => r.VehicleId == rental.VehicleId && 
                                        r.RentalId != rentalId && 
                                        r.Status != null && 
                                        r.Status.ToUpper() == "IN_PROGRESS");
                
                if (otherActiveRental != null)
                {
                    // Still rented by another customer
                    vehicle.Status = "Rented";
                }
                else
                {
                    // Check if there are reserved rentals (PAID or BOOKING)
                    var hasReservedRental = hasOtherActiveRentals
                        .Any(r => r.VehicleId == rental.VehicleId && 
                                 r.Status != null && 
                                 (r.Status.ToUpper() == "PAID" || r.Status.ToUpper() == "BOOKING"));
                    
                    if (hasReservedRental)
                    {
                        vehicle.Status = "Reserved";
                    }
                    else if (vehicle.Status == null || 
                             (vehicle.Status.ToUpper() != "MAINTENANCE" && vehicle.Status.ToUpper() != "UNAVAILABLE"))
                    {
                        // Only set to Available if not Maintenance or Unavailable
                        vehicle.Status = "Available";
                    }
                }
                await _vehicleRepo.UpdateAsync(vehicle);
            }
            
            return rental;
        }

        public async Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsPagedAsync(
            int pageNumber = 1,
            int pageSize = 10,
            string? status = null,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            Guid? stationId = null)
        {
            return await _rentalRepo.GetPaidRentalsPagedAsync(pageNumber, pageSize, status, search, startDate, endDate, stationId);
        }

        public async Task<Rental?> GetCompletedRentalByUserAndVehicleAsync(Guid userId, Guid vehicleId)
        {
            return await _rentalRepo.GetCompletedRentalByUserAndVehicleAsync(userId, vehicleId);
        }

        public async Task<(IEnumerable<Rental> Items, int TotalCount)> GetPaidRentalsByUserPagedAsync(
            Guid userId,
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            return await _rentalRepo.GetPaidRentalsByUserPagedAsync(userId, pageNumber, pageSize, search, startDate, endDate);
        }

        public async Task<CalculateRentalCostResponse> CalculateRentalCostAsync(Guid vehicleId, DateTime startTime, DateTime endTime)
        {
            // Validation thời gian
            if (endTime <= startTime)
            {
                return new CalculateRentalCostResponse
                {
                    IsValid = false,
                    ValidationMessage = "Thời gian kết thúc phải sau thời gian bắt đầu."
                };
            }

            var totalHours = (endTime - startTime).TotalHours;

            // Tối thiểu 24 giờ
            if (totalHours < 24)
            {
                return new CalculateRentalCostResponse
                {
                    IsValid = false,
                    ValidationMessage = "Thời gian thuê xe tối thiểu là 24 giờ."
                };
            }

            // Tính số ngày: nếu > 24h thì tính là ngày thứ 2
            var totalDays = Math.Ceiling(totalHours / 24.0);

            // Lấy thông tin xe
            var vehicle = await _vehicleRepo.GetVehicleByIdAsync(vehicleId);
            if (vehicle == null)
            {
                return new CalculateRentalCostResponse
                {
                    IsValid = false,
                    ValidationMessage = "Không tìm thấy xe."
                };
            }

            if (!vehicle.PricePerDay.HasValue)
            {
                return new CalculateRentalCostResponse
                {
                    IsValid = false,
                    ValidationMessage = "Xe chưa có giá thuê."
                };
            }

            var dailyRate = vehicle.PricePerDay.Value;
            var rentalCost = (decimal)totalDays * dailyRate;
            var depositAmount = rentalCost * 0.3m; // 30% của tổng tiền thuê

            return new CalculateRentalCostResponse
            {
                IsValid = true,
                Days = (int)totalDays,
                DailyRate = dailyRate,
                RentalCost = rentalCost,
                DepositAmount = depositAmount
            };
        }

        public async Task<RentalBillDto> GetRentalBillAsync(Guid rentalId)
        {
            var rental = await _rentalRepo.GetByIdAsync(rentalId);
            if (rental == null)
            {
                throw new KeyNotFoundException("Rental not found.");
            }

            var (rentalCost, days) = CalculateRentalCostForRental(rental);

            var deposit = await _depositRepo.GetByRentalIdAsync(rentalId);
            var penalties = await _rentalPenaltyRepo.GetByRentalIdAsync(rentalId);

            var penaltyAmount = penalties.Sum(p => p.Amount);

            var bill = new RentalBillDto
            {
                RentalId = rentalId,
                RentalCost = rentalCost,
                DepositAmount = deposit?.Amount ?? 0m,
                PenaltyAmount = penaltyAmount,
                TotalAmount = rentalCost + penaltyAmount,
                Penalties = penalties.Select(p => new RentalPenaltyDto
                {
                    RentalPenaltyId = p.RentalPenaltyId,
                    RentalId = p.RentalId,
                    PenaltyId = p.PenaltyId,
                    Amount = p.Amount,
                    Description = p.Description,
                    Status = p.Status,
                    PaidAmount = p.PaidAmount,
                    DepositUsedAmount = p.DepositUsedAmount,
                    PaymentMethod = p.PaymentMethod,
                    CreatedAt = p.CreatedAt,
                    PaidAt = p.PaidAt,
                    Penalty = p.Penalty != null ? new PenaltyDto
                    {
                        PenaltyId = p.Penalty.PenaltyId,
                        ViolationType = p.Penalty.ViolationType,
                        Description = p.Penalty.Description,
                        Amount = p.Penalty.Amount,
                        IsActive = p.Penalty.IsActive,
                        CreatedAt = p.Penalty.CreatedAt,
                        UpdatedAt = p.Penalty.UpdatedAt
                    } : null
                }).ToList()
            };

            if (deposit != null)
            {
                bill.Deposit = new DepositDto
                {
                    DepositId = deposit.DepositId,
                    RentalId = deposit.RentalId,
                    UserId = deposit.UserId,
                    Amount = deposit.Amount,
                    UsedAmount = deposit.UsedAmount,
                    AvailableAmount = deposit.Amount - deposit.UsedAmount,
                    Status = deposit.Status,
                    PaymentDate = deposit.PaymentDate,
                    RefundDate = deposit.RefundDate,
                    RefundReason = deposit.RefundReason,
                    LastUsedAt = deposit.LastUsedAt,
                    CreatedAt = deposit.CreatedAt
                };

                bill.RefundAmount = Math.Max(0, deposit.Amount - deposit.UsedAmount);
            }

            return bill;
        }

        private (decimal rentalCost, double totalDays) CalculateRentalCostForRental(Rental rental)
        {
            if (rental.TotalCost.HasValue && rental.TotalCost.Value > 0)
            {
                var hours = rental.StartTime.HasValue && rental.EndTime.HasValue
                    ? (rental.EndTime.Value - rental.StartTime.Value).TotalHours
                    : 24;
                return (rental.TotalCost.Value, Math.Ceiling(hours / 24.0));
            }

            if (rental.StartTime.HasValue && rental.EndTime.HasValue)
            {
                var start = rental.StartTime.Value;
                var end = rental.EndTime.Value;
                if (end > start)
                {
                    var totalHours = (end - start).TotalHours;
                    var totalDays = Math.Ceiling(totalHours / 24.0);
                    var price = rental.PricePerDaySnapshot ?? rental.Vehicle?.PricePerDay ?? 0m;
                    return ((decimal)totalDays * price, totalDays);
                }
            }

            return (0m, 0d);
        }

    }
}
