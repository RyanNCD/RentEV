# -----------------------------
# Stage 1: Build and Publish
# -----------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY Backend/APIRentEV/APIRentEV.csproj Backend/APIRentEV/
COPY Backend/Repository/Repository.csproj Backend/Repository/
COPY Backend/Service/Service.csproj Backend/Service/

RUN dotnet restore Backend/APIRentEV/APIRentEV.csproj

# Copy all source code
COPY . .

# Build and publish the app
RUN dotnet publish Backend/APIRentEV/APIRentEV.csproj -c Release -o /app

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published files
COPY --from=build /app .

# Expose port 8080
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Start the app
ENTRYPOINT ["dotnet", "APIRentEV.dll"]

