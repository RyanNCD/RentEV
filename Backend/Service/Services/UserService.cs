using Repository.Implementations;
using Repository.Models;

namespace Services
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
            existing.PasswordHash = user.PasswordHash;
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
    }
}
