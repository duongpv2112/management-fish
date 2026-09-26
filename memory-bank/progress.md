# Progress: Quản lý cân cá nhà Đặng Ánh

## What Works
- **Cấu trúc dự án cơ bản**: Dự án đã được thiết lập với Vue 3 và Vite, bao gồm các thành phần chính như ManagementFishViews.vue, DataViewer.vue, AddWeight.vue và StatisticData.vue.
- **Tích hợp API**: Ứng dụng đã có khả năng lấy dữ liệu từ backend thông qua các dịch vụ API như FishTypeAPI, với việc tải dữ liệu bất đồng bộ được triển khai trong các component.
- **Giao diện cơ bản**: Giao diện người dùng đã được thiết kế với các phần chính để hiển thị dữ liệu, thêm cân nặng và thống kê, sử dụng style scoped với SASS.
- **Chuyển đổi sang script setup**: Các tệp Vue chính đã được chuyển đổi sang cú pháp script setup của Vue 3, giúp mã nguồn gọn gàng và dễ bảo trì hơn.

## What's Left to Build
- **Tính năng nâng cao**: Thêm các tính năng như biểu đồ trực quan hóa dữ liệu, lọc và tìm kiếm dữ liệu cân cá theo các tiêu chí khác nhau.
- **Cải thiện giao diện**: Tinh chỉnh giao diện người dùng để tăng tính thẩm mỹ và khả năng sử dụng, có thể bao gồm việc thêm các biểu tượng, màu sắc và hiệu ứng.
- **Quản lý lỗi**: Triển khai xử lý lỗi tốt hơn cho các yêu cầu API và input của người dùng để tăng độ tin cậy của ứng dụng.
- **Tài liệu hướng dẫn**: Tạo tài liệu chi tiết cho người dùng cuối về cách sử dụng ứng dụng và các tính năng của nó.
- **Triển khai production**: Đảm bảo ứng dụng được build và triển khai đúng cách lên GitHub Pages hoặc một nền tảng hosting khác.

## Current Status
- Dự án đã hoàn thành việc chuyển đổi các tệp Vue chính sang cú pháp script setup của Vue 3.
- Memory Bank đã được cập nhật để phản ánh trạng thái hiện tại của dự án, bao gồm các thay đổi về mã nguồn và kế hoạch phát triển tiếp theo.
- Đang chờ phản hồi từ người dùng để xác định các ưu tiên phát triển tiếp theo.

## Known Issues
- **Hiệu suất tải dữ liệu**: Nếu lượng dữ liệu cân cá lớn, việc tải và hiển thị có thể chậm, cần tối ưu hóa cách dữ liệu được tải và hiển thị (ví dụ: phân trang).
- **Thiếu tính năng xác thực**: Hiện tại chưa có thông tin về việc xác thực người dùng hoặc phân quyền, điều này có thể cần được thêm vào để bảo vệ dữ liệu.
- **Khả năng tương thích trình duyệt**: Chưa có kiểm tra đầy đủ về khả năng tương thích trên các trình duyệt khác nhau, đặc biệt là các phiên bản cũ hơn.

## Evolution of Project Decisions
- Ban đầu, dự án được thiết lập như một ứng dụng Vue 3 cơ bản với Vite, tập trung vào việc quản lý cân cá.
- Quyết định sử dụng axios để tích hợp API được đưa ra để hỗ trợ giao tiếp với backend, thay vì các phương pháp khác như fetch API.
- Quyết định bản địa hóa giao diện bằng tiếng Việt được thực hiện để phù hợp với người dùng mục tiêu tại nhà Đặng Ánh.
- Việc khởi tạo Memory Bank được thực hiện để đảm bảo tài liệu dự án được duy trì tốt, hỗ trợ phát triển liên tục và bảo trì lâu dài.
- Quyết định chuyển đổi sang cú pháp script setup của Vue 3 được thực hiện để cải thiện cấu trúc mã nguồn và tuân thủ các tiêu chuẩn hiện đại.
