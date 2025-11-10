using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System.Linq;

namespace Repository.Implementations
{
    public class UserRepository 
    {
        private readonly SWP391RentEVContext _context;

        public UserRepository(SWP391RentEVContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .ToListAsync();
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users
                                 .Include(u => u.Role)
                                 .FirstOrDefaultAsync(u => u.UserId == id);
        }
        public async Task<User?> GetUseRoleByIdAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }
        public async Task<List<User>> GetUsersByRoleNameAsync(string roleName)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName != null && 
                           u.Role.RoleName.Trim().ToLower() == roleName.Trim().ToLower())
                .ToListAsync();
        }

        public async Task AddAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task<int> UpdateAsync(User user)
        {
             _context.Users.Update(user);
            return await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }
        public async Task DeleteUserAsync(User user)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<bool> IsUserBlacklistedAsync(Guid userId)
        {
            return await _context.Blacklists
                .AnyAsync(b => b.UserId == userId);
        }

        public async Task<HashSet<Guid>> GetBlacklistedUserIdsAsync()
        {
            var ids = await _context.Blacklists
                .Select(b => b.UserId)
                .ToListAsync();
            return ids.ToHashSet();
        }

        public async Task AddToBlacklistAsync(Blacklist blacklist)
        {
            _context.Blacklists.Add(blacklist);
            await _context.SaveChangesAsync();
        }
    }
}
