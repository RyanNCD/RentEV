using AutoMapper;
using Repository.DTO;
using Repository.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace APIRentEV.Mapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ===============================
            // 🚗 VEHICLE
            // ===============================
            CreateMap<Vehicle, VehicleDto>().ReverseMap();

            CreateMap<VehicleCreateDto, Vehicle>()
                .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => Guid.NewGuid()));

            CreateMap<VehicleUpdateDto, Vehicle>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ===============================
            // 🧑‍🤝‍🧑 USER
            // ===============================
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.RoleName : null))
                .ForMember(dest => dest.IsBlacklisted, opt => opt.Ignore()) // Will be set in controller
                .ReverseMap();

            CreateMap<UserCreateDto, User>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => BCrypt.Net.BCrypt.HashPassword(src.PasswordHash)))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UserUpdateDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()) // Sẽ xử lý trong service
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ===============================
            // 🏠 STATION
            // ===============================
            CreateMap<Station, StationDto>().ReverseMap();

            CreateMap<StationCreateDto, Station>()
                .ForMember(dest => dest.StationId, opt => opt.MapFrom(src => Guid.NewGuid()));

            CreateMap<StationUpdateDto, Station>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ===============================
            // 📜 CONTRACT
            // ===============================
            CreateMap<Contract, ContractDto>().ReverseMap();

            CreateMap<ContractCreateDto, Contract>()
                .ForMember(dest => dest.ContractId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTime.UtcNow))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status ?? "Pending"));

            CreateMap<ContractUpdateDto, Contract>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ===============================
            // 🚘 RENTAL
            // ===============================
            CreateMap<Rental, RentalDto>()
                .ForMember(dest => dest.VehicleName, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.VehicleName : null))
                .ReverseMap();

            CreateMap<RentalCreateDto, Rental>()
                .ForMember(dest => dest.RentalId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status ?? "Pending"))
                .ForMember(dest => dest.TotalCost, opt => opt.MapFrom(src => src.TotalCost ?? 0));

            CreateMap<RentalUpdateDto, Rental>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ===============================
            // 💬 FEEDBACK
            // ===============================
            CreateMap<Feedback, FeedbackDto>().ReverseMap();

            CreateMap<FeedbackCreateDto, Feedback>()
                .ForMember(dest => dest.FeedbackId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // ===============================
            // 💵 PAYMENT
            // ===============================
            CreateMap<Payment, PaymentDto>().ReverseMap();

            CreateMap<PaymentCreateDto, Payment>()
                .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status ?? "Pending"));
        }
    }
}
