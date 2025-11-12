using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interface
{
    public interface IContractService
    {
        Task<IEnumerable<Contract>> GetAllAsync();
        Task<Contract?> GetByIdAsync(Guid id);
        Task<Contract> CreateAsync(Contract contract);
        Task<Contract> UpdateAsync(Guid id, Contract contract);
        Task DeleteAsync(Guid id);
    }
}
