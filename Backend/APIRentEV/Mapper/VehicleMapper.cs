using Repository.DTO;
using Repository.Models;
using System.Net.NetworkInformation;

namespace APIRentEV.Mapper
{
    public static class VehicleMapper
    {
        public static VehicleDto ToDto(this Vehicle entity)
        {
            return new VehicleDto
            {
                VehicleId = entity.VehicleId,
                StationId = entity.StationId,
                VehicleName = entity.VehicleName,
                VehicleType = entity.VehicleType,
                BatteryCapacity = entity.BatteryCapacity,
                Status = entity.Status,
                PricePerDay = entity.PricePerDay,
                LicensePlate = entity.LicensePlate,
                Description = entity.Description,
                SeatingCapacity = entity.SeatingCapacity,
                Utilities = entity.Utilities
            };
        }

        // Map từ DTO tạo mới -> Entity
        public static Vehicle ToEntity(this VehicleCreateDto dto)
        {
            return new Vehicle
            {
                VehicleId = Guid.NewGuid(),
                StationId = dto.StationId,
                VehicleName = dto.VehicleName,
                VehicleType = dto.VehicleType,
                BatteryCapacity = dto.BatteryCapacity,
                Status = dto.Status,
                PricePerDay = dto.PricePerDay,
                LicensePlate = dto.LicensePlate,
                Description = dto.Description,
                SeatingCapacity = dto.SeatingCapacity,
                Utilities = dto.Utilities
            };
        }

        // Map update từ DTO -> Entity
        public static void MapUpdate(this VehicleUpdateDto dto, Vehicle entity)
        {
            entity.StationId = dto.StationId;
            entity.VehicleName = dto.VehicleName;
            entity.VehicleType = dto.VehicleType;
            entity.BatteryCapacity = dto.BatteryCapacity;
            entity.Status = dto.Status;
            entity.PricePerDay = dto.PricePerDay;
            entity.LicensePlate = dto.LicensePlate;
            entity.Description = dto.Description;
            entity.SeatingCapacity = dto.SeatingCapacity;
            entity.Utilities = dto.Utilities;
        }

    }
}
