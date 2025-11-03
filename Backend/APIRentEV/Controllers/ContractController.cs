using APIRentEV.Mapper;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Repository.DTO;
using Repository.Models;
using Service.Interface;

namespace APIRentEV.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly IMapper _mapper;

        public ContractController(IContractService contractService, IMapper mapper)
        {
            _contractService = contractService;
            _mapper = mapper;
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpGet]
        public async Task<IActionResult> GetAllContracts()
        {
            var contracts = await _contractService.GetAllAsync();
            var data = _mapper.Map<List<ContractDto>>(contracts);

            var message = data.Any()
                ? "Successfully retrieved all contracts."
                : "No contracts found in the system.";

            return Ok(new
            {
                message,
                total = data.Count,
                data
            });
        }


        [Authorize(Roles = "Admin,StaffStation,Customer")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetContractById(Guid id)
        {
            var contract = await _contractService.GetByIdAsync(id);
            if (contract == null)
            {
                return NotFound(new { message = $"Contract with ID {id} not found." });
            }

            return Ok(new
            {
                message = "Contract retrieved successfully.",
                data = _mapper.Map<ContractDto>(contract)
            });
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateContract([FromBody] ContractCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid input data.", errors = ModelState });

            var contract = _mapper.Map<Contract>(dto);
            var created = await _contractService.CreateAsync(contract);

            return CreatedAtAction(nameof(GetContractById),
                                   new { id = created.ContractId },
                                   new
                                   {
                                       message = "Contract created successfully.",
                                       data = _mapper.Map<ContractDto>(created)
                                   });
        }

        [Authorize(Roles = "Admin,StaffStation")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContract(Guid id, [FromBody] ContractUpdateDto dto)
        {
            var existing = await _contractService.GetByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Contract with ID {id} not found." });
            }

            _mapper.Map(dto, existing); // AutoMapper map các field không null
            await _contractService.UpdateAsync(id, existing);

            return Ok(new
            {
                message = "Contract updated successfully.",
                data = _mapper.Map<ContractDto>(existing)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContract(Guid id)
        {
            await _contractService.DeleteAsync(id);
            return Ok(new
            {
                message = "Contract deleted successfully."
            });
        }
    }
}
