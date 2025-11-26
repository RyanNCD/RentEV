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

            var paymentRevenue = await query.SumAsync(p => p.Amount);
            var totalPayments = await query.CountAsync();
            var averagePayment = totalPayments > 0 ? paymentRevenue / totalPayments : 0;

            var depositUsageQuery = _context.Deposits
                .Where(d => d.UsedAmount > 0 && d.LastUsedAt.HasValue);

            if (startDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt <= endDate.Value);
            }

            var depositRevenue = await depositUsageQuery.SumAsync(d => d.UsedAmount);
            var depositUsageCount = await depositUsageQuery.CountAsync();

            var penaltyCashQuery = _context.RentalPenalties
                .Where(rp => rp.PaidAmount > 0 && rp.PaidAt.HasValue);

            if (startDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt <= endDate.Value);
            }

            var penaltyCashRevenue = await penaltyCashQuery.SumAsync(rp => rp.PaidAmount);
            var penaltyCashCount = await penaltyCashQuery.CountAsync();

            var totalRevenue = paymentRevenue + depositRevenue + penaltyCashRevenue;

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

            revenueByMethod.Add(new
            {
                Method = "Deposit",
                Revenue = depositRevenue,
                Count = depositUsageCount
            });

            revenueByMethod.Add(new
            {
                Method = "PenaltyCash",
                Revenue = penaltyCashRevenue,
                Count = penaltyCashCount
            });

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                TotalPayments = totalPayments,
                AveragePayment = averagePayment,
                RevenueByMonth = revenueByMonth,
                RevenueByMethod = revenueByMethod,
                DepositRevenue = depositRevenue,
                PenaltyCashRevenue = penaltyCashRevenue
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

            var paymentDaily = await query
                .GroupBy(p => p.PaymentDate.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(p => p.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            var depositUsageQuery = _context.Deposits
                .Where(d => d.UsedAmount > 0 && d.LastUsedAt.HasValue);

            if (startDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt <= endDate.Value);
            }

            var depositDaily = await depositUsageQuery
                .GroupBy(d => d.LastUsedAt.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(d => d.UsedAmount),
                    Count = g.Count()
                })
                .ToListAsync();

            var penaltyCashQuery = _context.RentalPenalties
                .Where(rp => rp.PaidAmount > 0 && rp.PaidAt.HasValue);

            if (startDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt <= endDate.Value);
            }

            var penaltyDaily = await penaltyCashQuery
                .GroupBy(rp => rp.PaidAt.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(rp => rp.PaidAmount),
                    Count = g.Count()
                })
                .ToListAsync();

            var dailyDict = new Dictionary<DateTime, (decimal revenue, int count)>();

            foreach (var entry in paymentDaily)
            {
                dailyDict[entry.Date] = (entry.Revenue, entry.Count);
            }

            foreach (var entry in depositDaily)
            {
                if (dailyDict.TryGetValue(entry.Date, out var existing))
                {
                    dailyDict[entry.Date] = (existing.revenue + entry.Revenue, existing.count + entry.Count);
                }
                else
                {
                    dailyDict[entry.Date] = (entry.Revenue, entry.Count);
                }
            }

            foreach (var entry in penaltyDaily)
            {
                if (dailyDict.TryGetValue(entry.Date, out var existing))
                {
                    dailyDict[entry.Date] = (existing.revenue + entry.Revenue, existing.count + entry.Count);
                }
                else
                {
                    dailyDict[entry.Date] = (entry.Revenue, entry.Count);
                }
            }

            var result = dailyDict
                .Select(kvp => new
                {
                    Date = kvp.Key,
                    Revenue = kvp.Value.revenue,
                    Count = kvp.Value.count
                })
                .OrderBy(x => x.Date)
                .ToList();

            return Ok(result);
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

            // Payments grouped by station
            var paymentStation = await query
                .Join(_context.Rentals, p => p.RentalId, r => r.RentalId, (p, r) => new { Payment = p, Rental = r })
                .Join(_context.Stations, pr => pr.Rental.PickupStationId, s => s.StationId, (pr, s) => new
                {
                    Amount = pr.Payment.Amount,
                    StationId = s.StationId,
                    StationName = s.StationName,
                    StationAddress = s.Address
                })
                .GroupBy(x => new { x.StationId, x.StationName, x.StationAddress })
                .Select(g => new StationRevenueItem
                {
                    StationId = g.Key.StationId,
                    StationName = g.Key.StationName,
                    StationAddress = g.Key.StationAddress,
                    Revenue = g.Sum(x => x.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            // Deposit usage grouped by station
            var depositUsageQuery = _context.Deposits
                .Where(d => d.UsedAmount > 0 && d.LastUsedAt.HasValue);

            if (startDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                depositUsageQuery = depositUsageQuery.Where(d => d.LastUsedAt <= endDate.Value);
            }

            var depositStation = await depositUsageQuery
                .Join(_context.Rentals, d => d.RentalId, r => r.RentalId, (d, r) => new { Deposit = d, Rental = r })
                .Join(_context.Stations, dr => dr.Rental.PickupStationId, s => s.StationId, (dr, s) => new
                {
                    Amount = dr.Deposit.UsedAmount,
                    StationId = s.StationId,
                    StationName = s.StationName,
                    StationAddress = s.Address
                })
                .GroupBy(x => new { x.StationId, x.StationName, x.StationAddress })
                .Select(g => new StationRevenueItem
                {
                    StationId = g.Key.StationId,
                    StationName = g.Key.StationName,
                    StationAddress = g.Key.StationAddress,
                    Revenue = g.Sum(x => x.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            // Penalty cash grouped by station
            var penaltyCashQuery = _context.RentalPenalties
                .Where(rp => rp.PaidAmount > 0 && rp.PaidAt.HasValue);

            if (startDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                penaltyCashQuery = penaltyCashQuery.Where(rp => rp.PaidAt <= endDate.Value);
            }

            var penaltyStation = await penaltyCashQuery
                .Join(_context.Rentals, rp => rp.RentalId, r => r.RentalId, (rp, r) => new { Penalty = rp, Rental = r })
                .Join(_context.Stations, pr => pr.Rental.PickupStationId, s => s.StationId, (pr, s) => new
                {
                    Amount = pr.Penalty.PaidAmount,
                    StationId = s.StationId,
                    StationName = s.StationName,
                    StationAddress = s.Address
                })
                .GroupBy(x => new { x.StationId, x.StationName, x.StationAddress })
                .Select(g => new StationRevenueItem
                {
                    StationId = g.Key.StationId,
                    StationName = g.Key.StationName,
                    StationAddress = g.Key.StationAddress,
                    Revenue = g.Sum(x => x.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            var stationDict = paymentStation.ToDictionary(entry => entry.StationId, entry => entry);

            void AddOrUpdate(IEnumerable<StationRevenueItem> source)
            {
                foreach (var entry in source)
                {
                    if (stationDict.TryGetValue(entry.StationId, out var existing))
                    {
                        existing.Revenue += entry.Revenue;
                        existing.Count += entry.Count;
                    }
                    else
                    {
                        stationDict[entry.StationId] = new StationRevenueItem
                        {
                            StationId = entry.StationId,
                            StationName = entry.StationName,
                            StationAddress = entry.StationAddress,
                            Revenue = entry.Revenue,
                            Count = entry.Count
                        };
                    }
                }
            }

            AddOrUpdate(depositStation);
            AddOrUpdate(penaltyStation);

            var revenueByStation = stationDict.Values
                .OrderByDescending(x => x.Revenue)
                .ToList();

            return Ok(revenueByStation);
        }

        private class StationRevenueItem
        {
            public Guid StationId { get; set; }
            public string StationName { get; set; } = string.Empty;
            public string StationAddress { get; set; } = string.Empty;
            public decimal Revenue { get; set; }
            public int Count { get; set; }
        }
    }
}

