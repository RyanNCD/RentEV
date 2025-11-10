create database SWP391RentEV
go
use SWP391RentEV
go

CREATE TABLE [Role] (
  [RoleId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [RoleName] nvarchar(50) UNIQUE NOT NULL
)
GO

CREATE TABLE [User] (
  [UserId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [FullName] nvarchar(100) NOT NULL,
  [Email] nvarchar(100) UNIQUE NOT NULL,
  [Phone] nvarchar(20),
  [PasswordHash] nvarchar(255) NOT NULL,
  [IdentityCard] nvarchar(50),
  [DriverLicense] nvarchar(50),
  [RoleId] uniqueidentifier NOT NULL,
  [CreatedAt] datetime DEFAULT GETDATE()
)
GO

CREATE TABLE [Station] (
  [StationId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [StationName] nvarchar(100) NOT NULL,
  [Address] nvarchar(255) NOT NULL,
  [Latitude] decimal(9,6),
  [Longitude] decimal(9,6)
)
GO

CREATE TABLE [Vehicle] (
  [VehicleId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [StationId] uniqueidentifier NOT NULL,
  [VehicleType] nvarchar(50),
  [BatteryCapacity] int,
  [Status] nvarchar(50),
  [PricePerHour] decimal(10,2),
  [LicensePlate] nvarchar(20) UNIQUE
)
GO

CREATE TABLE [Rental] (
  [RentalId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [UserId] uniqueidentifier NOT NULL,
  [VehicleId] uniqueidentifier NOT NULL,
  [PickupStationId] uniqueidentifier NOT NULL,
  [ReturnStationId] uniqueidentifier,
  [StaffId] uniqueidentifier,
  [StartTime] datetime,
  [EndTime] datetime,
  [PickupNote] nvarchar(255),
  [PickupPhotoUrl] nvarchar(255),
  [ReturnNote] nvarchar(255),
  [ReturnPhotoUrl] nvarchar(255),
  [TotalCost] decimal(10,2),
  [Status] nvarchar(50)
)
GO

CREATE TABLE [Payment] (
  [PaymentId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [RentalId] uniqueidentifier NOT NULL,
  [Amount] decimal(10,2) NOT NULL,
  [Method] nvarchar(50),
  [Status] nvarchar(50),
  [CreatedAt] datetime DEFAULT GETDATE()
)
GO

CREATE TABLE [Deposit] (
  [DepositId] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  [RentalId] uniqueidentifier NOT NULL,
  [Amount] decimal(10,2) NOT NULL,
  [Status] nvarchar(50)
)
GO

-- FOREIGN KEYS
ALTER TABLE [User] ADD FOREIGN KEY ([RoleId]) REFERENCES [Role] ([RoleId])
GO

ALTER TABLE [Vehicle] ADD FOREIGN KEY ([StationId]) REFERENCES [Station] ([StationId])
GO

ALTER TABLE [Rental] ADD FOREIGN KEY ([UserId]) REFERENCES [User] ([UserId])
GO

ALTER TABLE [Rental] ADD FOREIGN KEY ([VehicleId]) REFERENCES [Vehicle] ([VehicleId])
GO

ALTER TABLE [Rental] ADD FOREIGN KEY ([PickupStationId]) REFERENCES [Station] ([StationId])
GO

ALTER TABLE [Rental] ADD FOREIGN KEY ([ReturnStationId]) REFERENCES [Station] ([StationId])
GO

ALTER TABLE [Rental] ADD FOREIGN KEY ([StaffId]) REFERENCES [User] ([UserId])
GO

ALTER TABLE [Payment] ADD FOREIGN KEY ([RentalId]) REFERENCES [Rental] ([RentalId])
GO

ALTER TABLE [Deposit] ADD FOREIGN KEY ([RentalId]) REFERENCES [Rental] ([RentalId])
GO
