using Repository.Implementations;
using Repository.Models;
using Service.Interface;
using System.Linq;

namespace Service.Services
{
    public class UserService : IUserService
    {
        private readonly UserRepository _userRepository;

        public UserService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            return await _userRepository.GetByIdAsync(id);
        }
        public async Task<List<User>> GetStaffStationUsersAsync()
        {
            return await _userRepository.GetUsersByRoleNameAsync("StaffStation");
        }

        public async Task<List<User>> GetCustomerUsersAsync()
        {
            return await _userRepository.GetUsersByRoleNameAsync("Customer");
        }

        public async Task<User> CreateUserAsync(User user)
        {
            user.UserId = Guid.NewGuid();
            user.CreatedAt = DateTime.UtcNow;
            await _userRepository.AddAsync(user);
            return user;
        }

        public async Task<User?> UpdateUserAsync(Guid id, User user)
        {
            var existing = await _userRepository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.FullName = user.FullName;
            existing.Email = user.Email;
            existing.Phone = user.Phone;
            
            // Chỉ update password nếu có giá trị mới
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            }
            
            existing.IdentityCard = user.IdentityCard;
            existing.DriverLicense = user.DriverLicense;
            existing.RoleId = user.RoleId;

            await _userRepository.UpdateAsync(existing);
            return existing;
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            var existing = await _userRepository.GetByIdAsync(id);
            if (existing == null) return false;

            await _userRepository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> DeleteStaffStationUserAsync(Guid userId)
        {
            var user = await _userRepository.GetUseRoleByIdAsync(userId);
            if (user == null) return false;

            // Nếu User có RoleName trực tiếp
            if (user.Role.RoleName != "StaffStation") return false;

            // Nếu User liên kết bảng Role
            // if (user.Role?.RoleName != "StaffStation") return false;

            await _userRepository.DeleteUserAsync(user);
            return true;
        }

        public async Task<User?> RevokeStaffRoleAsync(Guid userId)
        {
            var user = await _userRepository.GetUseRoleByIdAsync(userId);
            if (user == null) return null;

            // Kiểm tra xem user có phải Staff không
            var roleName = user.Role?.RoleName?.Trim() ?? "";
            if (!roleName.Equals("StaffStation", StringComparison.OrdinalIgnoreCase) && 
                !roleName.Equals("Staff", StringComparison.OrdinalIgnoreCase))
            {
                return null; // Không phải Staff, không thể thu hồi
            }

            // Lấy role Customer
            var allRoles = await _userRepository.GetAllRolesAsync();
            var customerRole = allRoles.FirstOrDefault(r => 
                r.RoleName != null && 
                r.RoleName.Trim().Equals("Customer", StringComparison.OrdinalIgnoreCase));
            
            if (customerRole == null) return null;

            // Đổi role thành Customer
            user.RoleId = customerRole.RoleId;
            await _userRepository.UpdateAsync(user);
            return user;
        }

        public async Task<User?> BanUserAsync(Guid userId, string reason, Guid adminId)
        {
            var existing = await _userRepository.GetByIdAsync(userId);
            if (existing == null) return null;

            // Lấy role Customer
            var customerRole = await _userRepository.GetAllRolesAsync();
            var customer = customerRole.FirstOrDefault(r => r.RoleName == "Customer");
            if (customer == null) return null;

            // Đổi role thành Customer
            existing.RoleId = customer.RoleId;
            await _userRepository.UpdateAsync(existing);

            // Kiểm tra xem user đã có trong blacklist chưa
            var isBlacklisted = await _userRepository.IsUserBlacklistedAsync(userId);
            if (!isBlacklisted)
            {
                // Thêm vào blacklist
                var blacklist = new Blacklist
                {
                    UserId = userId,
                    Reason = reason,
                    CreatedBy = adminId,
                    CreatedAt = DateTime.UtcNow
                };
                await _userRepository.AddToBlacklistAsync(blacklist);
            }

            return existing;
        }

        public async Task<User?> UpdateUserRoleAsync(Guid id, Guid roleId)
        {
            var existing = await _userRepository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.RoleId = roleId;
            await _userRepository.UpdateAsync(existing);
            return existing;
        }

        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _userRepository.GetAllRolesAsync();
        }

        public async Task<bool> IsUserBlacklistedAsync(Guid userId)
        {
            return await _userRepository.IsUserBlacklistedAsync(userId);
        }

        public async Task<HashSet<Guid>> GetBlacklistedUserIdsAsync()
        {
            return await _userRepository.GetBlacklistedUserIdsAsync();
        }
    }
}
