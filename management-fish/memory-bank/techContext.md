# Tech Context: Quản lý cân cá nhà Đặng Ánh

## Technologies Used
- **Vue 3**: Framework chính để xây dựng giao diện người dùng, sử dụng các tính năng hiện đại như Composition API để quản lý trạng thái và logic.
- **Vite**: Công cụ build và development server, giúp tăng tốc độ phát triển với hot module replacement và build nhanh chóng.
- **Vue Router**: Thư viện định tuyến để quản lý các trang và chế độ xem trong ứng dụng, hỗ trợ điều hướng mượt mà trong SPA.
- **Axios**: Thư viện HTTP client để giao tiếp với backend API, thực hiện các yêu cầu GET, POST, v.v. để lấy và gửi dữ liệu.
- **SASS**: Bộ tiền xử lý CSS để viết style có cấu trúc, sử dụng các biến và nesting để dễ dàng bảo trì.
- **@mdi/font**: Thư viện icon Material Design để thêm các biểu tượng trực quan vào giao diện người dùng.

## Development Setup
- **IDE khuyến nghị**: Visual Studio Code với extension Volar để hỗ trợ phát triển Vue 3 (khuyến nghị tắt Vetur nếu đã cài đặt).
- **Cài đặt dự án**: Sử dụng lệnh `npm install` để cài đặt các phụ thuộc được liệt kê trong package.json.
- **Chạy môi trường phát triển**: Sử dụng lệnh `npm run dev` hoặc `npm start` để khởi động development server với hot-reload.
- **Build cho production**: Sử dụng lệnh `npm run build` để tạo phiên bản tối ưu hóa của ứng dụng, sẵn sàng để triển khai.
- **Triển khai**: Sử dụng lệnh `npm run deploy` để triển khai ứng dụng lên GitHub Pages (yêu cầu chạy `npm run predeploy` trước đó để build).

## Technical Constraints
- **Client-side Rendering**: Ứng dụng chủ yếu hoạt động ở phía client, do đó hiệu suất phụ thuộc vào thiết bị của người dùng cuối và trình duyệt được sử dụng.
- **API Dependency**: Ứng dụng yêu cầu kết nối với backend API để lấy và lưu trữ dữ liệu. Nếu API không khả dụng, chức năng chính của ứng dụng sẽ bị ảnh hưởng.
- **Browser Compatibility**: Cần đảm bảo ứng dụng hoạt động tốt trên các trình duyệt phổ biến như Chrome, Firefox và Edge, đặc biệt là các phiên bản mới nhất.

## Dependencies
- **Production Dependencies**:
  - vue (^3.4.29)
  - vue-router (^4.4.0)
  - axios (^1.7.2)
  - sass (^1.77.6)
  - @mdi/font (^7.4.47)
- **Development Dependencies**:
  - @vitejs/plugin-vue (^5.0.5)
  - vite (^5.3.1)
  - gh-pages (^6.1.1)
  - sass (^1.77.6)

## Tool Usage Patterns
- **Vite Configuration**: Tệp vite.config.js được sử dụng để cấu hình build và development server, bao gồm các plugin như @vitejs/plugin-vue để hỗ trợ Vue 3.
- **Package Management**: Sử dụng npm để quản lý các phụ thuộc và chạy các script như dev, build, deploy.
- **Styling**: Sử dụng SASS với các tệp .scss để định nghĩa style, thường được scoped trong từng component để tránh xung đột CSS.
- **API Services**: Các dịch vụ API được tổ chức trong thư mục src/services/, ví dụ như FishTypeAPI.js, fishWeightAPI.js, để tách biệt logic giao tiếp với backend.
