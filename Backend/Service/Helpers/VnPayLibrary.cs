using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

public class VnPayHelper
{
    public static string CreatePaymentUrl(string baseUrl, string hashSecret, Dictionary<string, string> data)
    {
        // 1. Sắp xếp key theo alphabet
        var sorted = data.OrderBy(k => k.Key);
        var hashData = new StringBuilder();
        var query = new StringBuilder();

        foreach (var item in sorted)
        {
            if (!string.IsNullOrEmpty(item.Value))
            {
                var key = item.Key;
                var value = item.Value;

                hashData.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
                query.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
            }
        }

        hashData.Length--; // xóa & cuối cùng
        query.Length--;    // xóa & cuối cùng

        // 2. Tạo chữ ký HMAC SHA512
        var secureHash = HmacSha512(hashSecret, hashData.ToString());

        // 3. Thêm vnp_SecureHash vào URL
        var paymentUrl = $"{baseUrl}?{query}&vnp_SecureHash={secureHash}";
        return paymentUrl;
    }

    public static bool ValidateReturn(Dictionary<string, string> queryParams, string hashSecret)
    {
        if (!queryParams.TryGetValue("vnp_SecureHash", out var vnpSecureHash) || string.IsNullOrWhiteSpace(vnpSecureHash))
        {
            return false;
        }

        var filtered = queryParams
            .Where(k => k.Key != "vnp_SecureHash" && k.Key != "vnp_SecureHashType")
            .OrderBy(k => k.Key);

        var hashData = new StringBuilder();
        foreach (var item in filtered)
        {
            // Use the same URL-encoding scheme as when creating the request
            var keyEncoded = WebUtility.UrlEncode(item.Key);
            var valueEncoded = WebUtility.UrlEncode(item.Value);
            hashData.Append(keyEncoded + "=" + valueEncoded + "&");
        }
        if (hashData.Length == 0)
        {
            return false;
        }
        hashData.Length--; // remove trailing '&'

        var checkHash = HmacSha512(hashSecret, hashData.ToString());
        return string.Equals(vnpSecureHash, checkHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string HmacSha512(string key, string data)
    {
        // Sửa lỗi: Thêm .Trim() để loại bỏ khoảng trắng thừa từ HashSecret
        var trimmedKey = key.Trim();

        var keyBytes = Encoding.UTF8.GetBytes(trimmedKey);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);

        return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
    }
}
