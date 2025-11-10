using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IFeedbackService
    {
        Task<IEnumerable<Feedback>> GetAllAsync();
        Task<Feedback> GetByIdAsync(Guid id);
        Task<IEnumerable<Feedback>> GetByRentalIdAsync(Guid rentalId);
        Task<IEnumerable<Feedback>> GetByUserIdAsync(Guid userId);
        Task<Feedback> AddAsync(Feedback feedback);
        Task<bool> DeleteAsync(Guid id);
        Task<double> GetAverageRatingByRentalAsync(Guid rentalId);
    }
}
