using Repository.Models;

namespace Service.Interface
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);
        Task<List<User>> GetStaffStationUsersAsync();
        Task<List<User>> GetCustomerUsersAsync();
        Task<User> CreateUserAsync(User user);
        Task<User?> UpdateUserAsync(Guid id, User user);
        Task<bool> DeleteUserAsync(Guid id);
        Task<bool> DeleteStaffStationUserAsync(Guid userId);
        Task<User?> RevokeStaffRoleAsync(Guid userId);
        Task<User?> BanUserAsync(Guid userId, string reason, Guid adminId);
        Task<User?> UpdateUserRoleAsync(Guid id, Guid roleId);
        Task<List<Role>> GetAllRolesAsync();
        Task<bool> IsUserBlacklistedAsync(Guid userId);
        Task<HashSet<Guid>> GetBlacklistedUserIdsAsync();
    }
}
    