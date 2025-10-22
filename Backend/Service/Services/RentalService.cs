using Repository.DTO;
using Repository.Implementations;
using Repository.Models;
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
     

        public RentalService(RentalRepository rentalRepo)
        {
            _rentalRepo = rentalRepo;
            
        }

        public async Task<Rental> CreateRentalAsync(RentalCreateDto dto)
        {


            // Tạo rental mới theo DB
            var rental = new Rental
            {
                RentalId = Guid.NewGuid(),
                UserId = dto.UserId,
                VehicleId = dto.VehicleId,
                PickupStationId = dto.PickupStationId,
                ReturnStationId = dto.ReturnStationId,
                StaffId = dto.UserId,
                StartTime = dto.StartTime,
                EndTime = null,                 // chưa kết thúc
                PickupNote = dto.PickupNote,
                ReturnNote = null,
                TotalCost = 0,                  // tính sau
                Status = "Ongoing"              // trạng thái ban đầu
            };

            // Cập nhật xe
            

            // Lưu
            await _rentalRepo.AddAsync(rental);
            await _rentalRepo.SaveChangesAsync();
           

            return rental;
        }
        public async Task<Rental?> UpdateRentalAsync(RentalUpdateDto dto)
        {
            var rental = await _rentalRepo.GetByIdAsync(dto.RentalId);
            if (rental == null) return null;

            rental.UserId = dto.UserId ?? rental.UserId;
            rental.VehicleId = dto.VehicleId ?? rental.VehicleId;
            rental.PickupStationId = dto.PickupStationId ?? rental.PickupStationId;
            rental.ReturnStationId = dto.ReturnStationId ?? rental.ReturnStationId;
            rental.StaffId = dto.StaffId ?? rental.StaffId;
            rental.StartTime = dto.StartTime ?? rental.StartTime;
            rental.EndTime = dto.EndTime ?? rental.EndTime;
            rental.PickupNote = dto.PickupNote ?? rental.PickupNote;
            rental.ReturnNote = dto.ReturnNote ?? rental.ReturnNote;
            rental.TotalCost = dto.TotalCost ?? rental.TotalCost;
            rental.Status = dto.Status ?? rental.Status;

            return await _rentalRepo.UpdateAsync(rental);
        }



        public async Task<Rental?> GetRentalByIdAsync(Guid id)
        {
            return await _rentalRepo.GetByIdAsync(id);
        }
    }
}
