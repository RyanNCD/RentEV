version: "3.9"
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Your_strong_passw0rd!
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"

  backend:
    build:
      context: .
      dockerfile: ./Backend/APIRentEV/Dockerfile   # hoặc Dockerfile bạn vừa gửi ở root, chỉnh đường dẫn cho đúng
    environment:
      - ASPNETCORE_URLS=http://+:8080
      - ConnectionStrings__Default=Server=db,1433;Database=RentEV;User Id=sa;Password=Your_strong_passw0rd!;Encrypt=true;TrustServerCertificate=true
    depends_on:
      - db
    ports:
      - "8080:8080"

  frontend:
    build:
      context: ./greengo-auth
      dockerfile: Dockerfile
    environment:
      - VITE_API=http://localhost:8080
    depends_on:
      - backend
    ports:
      - "5173:5173"
