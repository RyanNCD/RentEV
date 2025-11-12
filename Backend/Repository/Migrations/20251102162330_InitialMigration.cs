using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Role",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    RoleName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Role__8AFACE1AF489698B", x => x.RoleId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Station",
                columns: table => new
                {
                    StationId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    StationName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Latitude = table.Column<double>(type: "double", nullable: true),
                    Longitude = table.Column<double>(type: "double", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Station__E0D8A6BDE163D1A0", x => x.StationId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    FullName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdentityCard = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DriverLicense = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoleId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__User__1788CC4CC600D509", x => x.UserId);
                    table.ForeignKey(
                        name: "FK__User__RoleId__4F7CD00D",
                        column: x => x.RoleId,
                        principalTable: "Role",
                        principalColumn: "RoleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Vehicle",
                columns: table => new
                {
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    StationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    VehicleName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VehicleType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BatteryCapacity = table.Column<int>(type: "int", nullable: true),
                    LicensePlate = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Available")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PricePerDay = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SeatingCapacity = table.Column<int>(type: "int", nullable: true),
                    Utilities = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumberOfRenters = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Vehicle__476B54928E3106DE", x => x.VehicleId);
                    table.ForeignKey(
                        name: "FK__Vehicle__Station__59063A47",
                        column: x => x.StationId,
                        principalTable: "Station",
                        principalColumn: "StationId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Blacklist",
                columns: table => new
                {
                    BlacklistId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Reason = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Blacklis__AFDBF4182C7461E8", x => x.BlacklistId);
                    table.ForeignKey(
                        name: "FK__Blacklist__Creat__3493CFA7",
                        column: x => x.CreatedBy,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__Blacklist__UserI__339FAB6E",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Contract",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StartDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    Terms = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TotalAmount = table.Column<decimal>(type: "decimal(20,2)", nullable: true),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Active")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Contract__C90D3469C4705457", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK__Contract__UserId__5EBF139D",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__Contract__Vehicl__5FB337D6",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "VehicleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Reservation",
                columns: table => new
                {
                    ReservationId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReservedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    StartDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Pending")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Reservat__B7EE5F2483D8858D", x => x.ReservationId);
                    table.ForeignKey(
                        name: "FK__Reservati__Stati__1F98B2C1",
                        column: x => x.StationId,
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK__Reservati__UserI__1DB06A4F",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__Reservati__Vehic__1EA48E88",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "VehicleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Rental",
                columns: table => new
                {
                    RentalId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    ContractId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PickupStationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReturnStationId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    StaffId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    StartTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    EndTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    TotalCost = table.Column<decimal>(type: "decimal(20,2)", nullable: true),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Pending")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Rental__97005943384E2FF7", x => x.RentalId);
                    table.ForeignKey(
                        name: "FK_Rental_Contract",
                        column: x => x.ContractId,
                        principalTable: "Contract",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK__Rental__PickupSt__68487DD7",
                        column: x => x.PickupStationId,
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK__Rental__ReturnSt__693CA210",
                        column: x => x.ReturnStationId,
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK__Rental__StaffId__6A30C649",
                        column: x => x.StaffId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__Rental__UserId__66603565",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__Rental__VehicleI__6754599E",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "VehicleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Feedback",
                columns: table => new
                {
                    FeedbackId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    RentalId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Rating = table.Column<int>(type: "int", nullable: true),
                    Comment = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Feedback__6A4BEDD6E580CFC0", x => x.FeedbackId);
                    table.ForeignKey(
                        name: "FK__Feedback__Rental__778AC167",
                        column: x => x.RentalId,
                        principalTable: "Rental",
                        principalColumn: "RentalId");
                    table.ForeignKey(
                        name: "FK__Feedback__UserId__76969D2E",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "IncidentReport",
                columns: table => new
                {
                    ReportId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    RentalId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    StaffId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReportDate = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Open")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Incident__D5BD4805714850A8", x => x.ReportId);
                    table.ForeignKey(
                        name: "FK__IncidentR__Renta__2BFE89A6",
                        column: x => x.RentalId,
                        principalTable: "Rental",
                        principalColumn: "RentalId");
                    table.ForeignKey(
                        name: "FK__IncidentR__Staff__2EDAF651",
                        column: x => x.StaffId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__IncidentR__UserI__2DE6D218",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK__IncidentR__Vehic__2CF2ADDF",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "VehicleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Payment",
                columns: table => new
                {
                    PaymentId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    RentalId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Amount = table.Column<decimal>(type: "decimal(20,2)", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    PaymentMethod = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "Pending")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Payment__9B556A383F0D9C78", x => x.PaymentId);
                    table.ForeignKey(
                        name: "FK__Payment__RentalI__6FE99F9F",
                        column: x => x.RentalId,
                        principalTable: "Rental",
                        principalColumn: "RentalId");
                    table.ForeignKey(
                        name: "FK__Payment__UserId__70DDC3D8",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RentalImage",
                columns: table => new
                {
                    ImageId = table.Column<Guid>(type: "char(36)", nullable: false, defaultValueSql: "(UUID())", collation: "ascii_general_ci"),
                    RentalId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ImageUrl = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Note = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RentalIm__7516F70C713896C0", x => x.ImageId);
                    table.ForeignKey(
                        name: "FK__RentalIma__Renta__17F790F9",
                        column: x => x.RentalId,
                        principalTable: "Rental",
                        principalColumn: "RentalId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Blacklist_CreatedBy",
                table: "Blacklist",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Blacklist_UserId",
                table: "Blacklist",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Contract_UserId",
                table: "Contract",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Contract_VehicleId",
                table: "Contract",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedback_RentalId",
                table: "Feedback",
                column: "RentalId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedback_UserId",
                table: "Feedback",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReport_RentalId",
                table: "IncidentReport",
                column: "RentalId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReport_StaffId",
                table: "IncidentReport",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReport_UserId",
                table: "IncidentReport",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReport_VehicleId",
                table: "IncidentReport",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_RentalId",
                table: "Payment",
                column: "RentalId");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_UserId",
                table: "Payment",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_ContractId",
                table: "Rental",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_PickupStationId",
                table: "Rental",
                column: "PickupStationId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_ReturnStationId",
                table: "Rental",
                column: "ReturnStationId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_StaffId",
                table: "Rental",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_UserId",
                table: "Rental",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Rental_VehicleId",
                table: "Rental",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_RentalImage_RentalId",
                table: "RentalImage",
                column: "RentalId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_StationId",
                table: "Reservation",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_UserId",
                table: "Reservation",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_VehicleId",
                table: "Reservation",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_User_RoleId",
                table: "User",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "UQ__User__A9D10534C6163B8C",
                table: "User",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicle_StationId",
                table: "Vehicle",
                column: "StationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Blacklist");

            migrationBuilder.DropTable(
                name: "Feedback");

            migrationBuilder.DropTable(
                name: "IncidentReport");

            migrationBuilder.DropTable(
                name: "Payment");

            migrationBuilder.DropTable(
                name: "RentalImage");

            migrationBuilder.DropTable(
                name: "Reservation");

            migrationBuilder.DropTable(
                name: "Rental");

            migrationBuilder.DropTable(
                name: "Contract");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Vehicle");

            migrationBuilder.DropTable(
                name: "Role");

            migrationBuilder.DropTable(
                name: "Station");
        }
    }
}
