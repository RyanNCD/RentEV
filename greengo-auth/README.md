# GreenGo - EV Station-based Rental System

Hệ thống cho thuê xe điện (EV) dựa trên điểm thuê (Station-based) với đầy đủ chức năng quản lý cho Admin, Staff và Khách hàng.

## 🚀 Tính năng chính

### 1. Người thuê (EV Renter)
- ✅ Đăng ký & xác thực (GPLX, CMND/CCCD)
- 🔍 Tìm điểm thuê trên bản đồ, xem xe có sẵn
- 📅 Đặt xe trước hoặc đến trực tiếp
- 🚗 Nhận xe & trả xe với quy trình bàn giao rõ ràng
- 📊 Lịch sử thuê xe & phân tích cá nhân

### 2. Nhân viên điểm thuê (Station Staff) - `/staff`
- 📥 **Giao xe**: Check-in, kiểm tra xe, chụp ảnh, ký xác nhận
- 📤 **Nhận xe**: Check-out, kiểm tra tình trạng trả xe
- ✅ **Xác thực khách hàng**: Kiểm tra GPLX & CMND/CCCD
- 💳 **Thanh toán**: Ghi nhận phí thuê, đặt cọc, hoàn cọc
- 🚗 **Quản lý xe tại điểm**: Cập nhật pin, báo cáo sự cố

### 3. Quản trị (Admin) - `/admin`
- 🚙 **Quản lý xe & điểm thuê**: Giám sát đội xe, lịch sử giao/nhận
- 👥 **Quản lý khách hàng**: Hồ sơ, lịch sử, xử lý khiếu nại
- 👨‍💼 **Quản lý nhân viên**: Hiệu suất, đánh giá
- 📈 **Báo cáo & phân tích**: Doanh thu, giờ cao điểm, AI dự báo nhu cầu

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router v7
- **Build Tool**: Vite 7
- **Styling**: CSS Variables + Custom Design System
- **State Management**: React Hooks (useState, useNavigate)

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

## 🎨 Cấu trúc project

```
src/
├── components/          # Các component tái sử dụng
│   ├── AuthHero.tsx    # Trang đăng nhập
│   ├── DataTable.tsx   # Bảng dữ liệu động
│   ├── Modal.tsx       # Modal dialog
│   ├── Navbar.tsx      # Navigation bar
│   ├── SearchBar.tsx   # Tìm kiếm xe
│   ├── StatsCard.tsx   # Card thống kê
│   ├── Tabs.tsx        # Tab navigation
│   └── ...
├── pages/              # Các trang chính
│   ├── AdminPage.tsx   # Trang quản trị (/admin)
│   ├── StaffPage.tsx   # Trang nhân viên (/staff)
│   ├── HomePage.tsx    # Trang chủ (/home)
│   └── SearchResults.tsx
├── data/               # Mock data
│   └── cities.tsx
├── styles/            # CSS
│   └── tokens.css
└── App.tsx            # Router chính
```

## 🔐 Tài khoản Demo

### 👨‍💼 Admin (Quản trị hệ thống)
```
Email: admin@greengo.vn
Password: admin123
→ Tự động chuyển đến /admin
```

### 👨‍🔧 Staff (Nhân viên điểm thuê)
```
Email: staff@greengo.vn
Password: staff123
→ Tự động chuyển đến /staff
```

### 🚗 Renter (Khách thuê xe)
```
Email: demo@greengo.vn
Password: greengo123
→ Tự động chuyển đến /home
```

## 📱 Routes

- `/` - Trang đăng nhập
- `/home` - Trang chủ (sau khi đăng nhập)
- `/search` - Kết quả tìm xe
- `/admin` - Trang quản trị (Admin)
- `/staff` - Trang nhân viên điểm thuê (Staff)

## 🎯 Tính năng nổi bật

### Admin Dashboard
- 📊 Thống kê tổng quan: Tổng số xe, xe đang thuê, doanh thu, khách hàng mới
- 📈 Doanh thu theo điểm thuê với biểu đồ trực quan
- 🔍 Quản lý chi tiết xe, khách hàng, nhân viên với DataTable tương tác
- 🤖 AI dự báo nhu cầu & đề xuất tối ưu
- ⏰ Thống kê giờ cao điểm

### Staff Dashboard
- 🚗 Quản lý xe tại điểm với trạng thái real-time
- 📅 Lịch giao/nhận xe trong ngày
- ✅ Quy trình check-in/out chi tiết với chụp ảnh, ghi chú
- 🔍 Xác thực khách hàng (GPLX, CCCD)
- 💳 Quản lý thanh toán & đặt cọc

## 🎨 Design System

Project sử dụng design system tùy chỉnh với:
- 🎨 Color tokens: Primary green (#19B305)
- 📏 Spacing system nhất quán
- 🔘 Button variants: primary, ghost
- 📦 Card component với shadow & border radius
- 📱 Responsive design (mobile-first)

## 📝 TODO

- [ ] Tích hợp API backend
- [ ] Kết nối bản đồ (Google Maps / Mapbox)
- [ ] Upload & hiển thị ảnh xe
- [ ] Real-time notifications
- [ ] Payment gateway integration
- [ ] AI prediction models
- [ ] Mobile app (React Native)

## 👨‍💻 Development

Để thêm tính năng mới:

1. Tạo component trong `src/components/`
2. Tạo page trong `src/pages/` (nếu cần)
3. Thêm route trong `src/App.tsx`
4. Cập nhật styles trong `src/index.css`

## 📄 License

Private project - GreenGo © 2025
