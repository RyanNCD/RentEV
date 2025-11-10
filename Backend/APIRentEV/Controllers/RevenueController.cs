using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace APIRentEV.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class RevenueController : ControllerBase
    {
        private readonly SWP391RentEVContext _context;

        public RevenueController(SWP391RentEVContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetRevenueSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Payments
                .Where(p => p.Status != null && p.Status.ToUpper() == "SUCCESS");

            if (startDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= endDate.Value);
            }

            var totalRevenue = await query.SumAsync(p => p.Amount);
            var totalPayments = await query.CountAsync();
            var averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

            // Revenue by month
            var revenueByMonth = await query
                .GroupBy(p => new { Year = p.PaymentDate.Value.Year, Month = p.PaymentDate.Value.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(p => p.Amount),
                    Count = g.Count()
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            // Revenue by payment method
            var revenueByMethod = await query
                .GroupBy(p => p.PaymentMethod ?? "Unknown")
                .Select(g => new
                {
                    Method = g.Key,
                    Revenue = g.Sum(p => p.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                TotalPayments = totalPayments,
                AveragePayment = averagePayment,
                RevenueByMonth = revenueByMonth,
                RevenueByMethod = revenueByMethod
            });
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyRevenue([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Payments
                .Where(p => p.Status != null && p.Status.ToUpper() == "SUCCESS");

            if (startDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= endDate.Value);
            }

            var dailyRevenue = await query
                .GroupBy(p => p.PaymentDate.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(p => p.Amount),
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return Ok(dailyRevenue);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentPayments([FromQuery] int limit = 10)
        {
            var payments = await _context.Payments
                .Where(p => p.Status != null && p.Status.ToUpper() == "SUCCESS")
                .Include(p => p.User)
                .Include(p => p.Rental)
                    .ThenInclude(r => r.Vehicle)
                .OrderByDescending(p => p.PaymentDate)
                .Take(limit)
                .Select(p => new
                {
                    PaymentId = p.PaymentId,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    UserName = p.User.FullName,
                    VehicleName = p.Rental.Vehicle.VehicleName
                })
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("by-station")]
        public async Task<IActionResult> GetRevenueByStation([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Payments
                .Where(p => p.Status != null && p.Status.ToUpper() == "SUCCESS");

            if (startDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= endDate.Value);
            }

            // Group by pickup station using Select to avoid Include issues
            var revenueByStation = await query
                .Join(_context.Rentals, p => p.RentalId, r => r.RentalId, (p, r) => new { Payment = p, Rental = r })
                .Join(_context.Stations, pr => pr.Rental.PickupStationId, s => s.StationId, (pr, s) => new
                {
                    Payment = pr.Payment,
                    StationId = s.StationId,
                    StationName = s.StationName,
                    StationAddress = s.Address
                })
                .GroupBy(x => new
                {
                    StationId = x.StationId,
                    StationName = x.StationName,
                    StationAddress = x.StationAddress
                })
                .Select(g => new
                {
                    StationId = g.Key.StationId,
                    StationName = g.Key.StationName,
                    StationAddress = g.Key.StationAddress,
                    Revenue = g.Sum(x => x.Payment.Amount),
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Revenue)
                .ToListAsync();

            return Ok(revenueByStation);
        }
    }
}

