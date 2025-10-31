using Microsoft.EntityFrameworkCore;
using Repository.Models;

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
            return await _context.Users.ToListAsync();
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users
                                 .Include(u => u.Role)
                                 .FirstOrDefaultAsync(u => u.UserId == id);
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
    }
}
