using Repository.DTO;
using Repository.Models;

namespace APIRentEV.Mapper
{
    public static class StationMapper
    {
        public static StationDto ToDto(this Station entity)
        {
            return new StationDto
            {
                StationId = entity.StationId,
                StationName = entity.StationName,
                Address = entity.Address,
                Latitude = entity.Latitude,
                Longitude = entity.Longitude
            };
        }

        // Map từ DTO tạo mới -> Entity
        public static Station ToEntity(this StationCreateDto dto)
        {
            return new Station
            {
                StationId = Guid.NewGuid(),
                StationName = dto.StationName,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };
        }

        // Map update từ DTO -> Entity
        public static void MapUpdate(this StationUpdateDto dto, Station entity)
        {
            entity.StationName = dto.StationName;
            entity.Address = dto.Address;
            entity.Latitude = dto.Latitude;
            entity.Longitude = dto.Longitude;
        }
    }
}
