using Repository.Models;

namespace Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);
        Task<List<User>> GetStaffStationUsersAsync();
        Task<User> CreateUserAsync(User user);
        Task<User?> UpdateUserAsync(Guid id, User user);
        Task<bool> DeleteUserAsync(Guid id);
        Task<bool> DeleteStaffStationUserAsync(Guid userId);
    }
}
    