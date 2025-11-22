# ===== BUILD STAGE =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ solution (gồm API, Repository, Service)
COPY . .

# Restore tất cả project trong solution
RUN dotnet restore APIRentEV/APIRentEV.csproj

# Publish web API
RUN dotnet publish APIRentEV/APIRentEV.csproj -c Release -o /app/out

# ===== RUNTIME STAGE =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "APIRentEV.dll"]
