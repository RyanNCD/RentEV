using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace APIRentEV.Helpers
{
    /// <summary>
    /// Custom JSON converter for DateTime to always serialize as UTC with Z suffix
    /// </summary>
    public class DateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.GetDateTime().ToUniversalTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Always serialize as UTC with Z suffix
            DateTime utcValue;
            if (value.Kind == DateTimeKind.Unspecified)
            {
                // If kind is unspecified, assume it's already in GMT+7 (Vietnam time)
                // Convert to UTC by subtracting 7 hours
                utcValue = value.AddHours(-7);
                utcValue = DateTime.SpecifyKind(utcValue, DateTimeKind.Utc);
            }
            else
            {
                utcValue = value.ToUniversalTime();
            }
            
            writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
    }

    /// <summary>
    /// Custom JSON converter for DateTime? to always serialize as UTC with Z suffix
    /// </summary>
    public class NullableDateTimeConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;
            return reader.GetDateTime().ToUniversalTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            // Always serialize as UTC with Z suffix
            DateTime utcValue;
            if (value.Value.Kind == DateTimeKind.Unspecified)
            {
                // If kind is unspecified, assume it's already in GMT+7 (Vietnam time)
                // Convert to UTC by subtracting 7 hours
                utcValue = value.Value.AddHours(-7);
                utcValue = DateTime.SpecifyKind(utcValue, DateTimeKind.Utc);
            }
            else
            {
                utcValue = value.Value.ToUniversalTime();
            }
            
            writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
    }
}

