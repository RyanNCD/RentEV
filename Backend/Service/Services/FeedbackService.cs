using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Services
{
    public class FeedbackService: IFeedbackService
    {
        private readonly FeedbackRepository _feedbackRepository;

        public FeedbackService(FeedbackRepository feedbackRepository)
        {
            _feedbackRepository = feedbackRepository;
        }

        public async Task<IEnumerable<Feedback>> GetAllAsync()
        {
            return await _feedbackRepository.GetAllAsync();
        }

        public async Task<Feedback> GetByIdAsync(Guid id) 
        { 
            return await _feedbackRepository.GetByIdAsync(id); 
        }

        public async Task<IEnumerable<Feedback>> GetByRentalIdAsync(Guid rentalId) 
        { 
            return await _feedbackRepository.GetByRentalIdAsync(rentalId); 
        }

        public async Task<IEnumerable<Feedback>> GetByUserIdAsync(Guid userId)
        { 
            return await _feedbackRepository.GetByUserIdAsync(userId); 
        }

        public async Task<Feedback> AddAsync(Feedback feedback)
        {
            return await _feedbackRepository.AddAsync(feedback);
        }

        public async Task<bool> DeleteAsync(Guid id)
        { 
            return await _feedbackRepository.DeleteAsync(id); 
        }

        public async Task<double> GetAverageRatingByRentalAsync(Guid rentalId)
        {
            return await _feedbackRepository.GetAverageRatingByRentalAsync(rentalId);
        }
    }
}
