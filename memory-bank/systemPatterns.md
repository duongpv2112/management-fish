# System Patterns: Quản lý cân cá nhà Đặng Ánh

## System Architecture
Ứng dụng được xây dựng dựa trên kiến trúc client-side sử dụng Vue 3 và Vite. Đây là một ứng dụng web đơn trang (Single Page Application - SPA) với các thành phần giao diện được tổ chức theo cấu trúc component-based của Vue. Dữ liệu được lấy và gửi thông qua các API RESTful sử dụng thư viện axios.

### Core Components
- **ManagementFishViews.vue**: Thành phần chính chịu trách nhiệm hiển thị giao diện tổng quan, bao gồm các phần như DataViewer, AddWeight và StatisticData.
- **DataViewer.vue**: Hiển thị dữ liệu cân cá dưới dạng bảng hoặc danh sách, cho phép người dùng xem thông tin chi tiết.
- **AddWeight.vue**: Cung cấp giao diện để người dùng nhập thông tin cân nặng mới cho các loại cá.
- **StatisticData.vue**: Tổng hợp và hiển thị các số liệu thống kê liên quan đến dữ liệu cân cá.

## Key Technical Decisions
- **Vue 3 và Vite**: Sử dụng Vue 3 để tận dụng các tính năng hiện đại như Composition API và cải thiện hiệu suất. Vite được chọn làm công cụ build để tăng tốc độ phát triển và build.
- **Vue Router**: Được tích hợp để quản lý định tuyến trong ứng dụng, cho phép chuyển đổi giữa các trang hoặc chế độ xem khác nhau.
- **Axios**: Sử dụng để giao tiếp với backend API, lấy và gửi dữ liệu về các loại cá và cân nặng.
- **SASS**: Được sử dụng để viết CSS theo cách có cấu trúc và dễ bảo trì, với các biến và style scoped cho từng component.

## Design Patterns in Use
- **Component-Based Architecture**: Các thành phần giao diện được chia nhỏ thành các component tái sử dụng, giúp dễ dàng bảo trì và mở rộng.
- **Asynchronous Data Loading**: Dữ liệu được tải bất đồng bộ từ API khi component được mounted, sử dụng các hàm async/await để xử lý.
- **State Management**: Sử dụng ref và reactive từ Vue để quản lý trạng thái trong các component, đảm bảo dữ liệu được cập nhật tự động khi có thay đổi.

## Component Relationships
- **ManagementFishViews** là component cha, chứa các component con như **DataViewer**, **AddWeight** và **StatisticData**.
- **DataViewer** nhận dữ liệu từ API thông qua props hoặc trực tiếp từ state của component cha để hiển thị.
- **AddWeight** hoạt động độc lập để thu thập input từ người dùng và gửi dữ liệu mới đến API.
- **StatisticData** tổng hợp dữ liệu từ API hoặc state để tính toán và hiển thị các số liệu thống kê.

## Critical Implementation Paths
- **API Integration**: Các dịch vụ API như FishTypeAPI.js, fishWeightAPI.js và basketTypeAPI.js được sử dụng để giao tiếp với backend, đảm bảo dữ liệu được lấy và lưu trữ chính xác.
- **Responsive Design**: Ứng dụng được thiết kế với các style linh hoạt (flexbox, gap, v.v.) để đảm bảo giao diện hoạt động tốt trên nhiều kích thước màn hình.
- **Localization**: Các chuỗi văn bản trong giao diện được viết bằng tiếng Việt để phù hợp với người dùng mục tiêu.
