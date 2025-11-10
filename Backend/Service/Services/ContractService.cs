using Repository.Models;
using Repository.Repositories;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Service.Services
{
    public class ContractService : IContractService
    {
        private readonly ContractRepository _contractRepository;

        public ContractService(ContractRepository contractRepository)
        {
            _contractRepository = contractRepository;
        }

        public async Task<Contract> CreateAsync(Contract contract)
        {
            await _contractRepository.AddContractlAsync(contract);
            return contract;
        }

        public async Task DeleteAsync(Guid id)
        {
            var existing = await _contractRepository.GetContractByIdAsync(id);
            await _contractRepository.DeleteAsync(id);
        }


        public async Task<IEnumerable<Contract>> GetAllAsync()
        {
            return await _contractRepository.GetContractAllAsync();
        }


        public async Task<Contract?> GetByIdAsync(Guid id)
        {
            return await _contractRepository.GetContractByIdAsync(id);
        }

        public async Task<Contract> UpdateAsync(Guid id, Contract contract)
        {
            var existing = await _contractRepository.GetContractByIdAsync(id);
            if (existing == null)
                throw new KeyNotFoundException($"Contract with ID {id} not found");

            existing.StartDate = contract.StartDate;
            existing.EndDate = contract.EndDate;
            existing.Terms = contract.Terms;
            existing.TotalAmount = contract.TotalAmount;
            existing.Status = contract.Status;

            await _contractRepository.UpdateAsync(existing);
            return existing;
        }
    }
}
