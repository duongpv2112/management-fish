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

## Cập nhật 2026-09-26 — Hạ tầng test & sửa lỗi (kế hoạch 02)
- `npm test` chạy Vitest + @vue/test-utils (jsdom), test trong `tests/`.
- `baseAPI` coi `{ success: false }` và lỗi mạng là lỗi (thông báo tiếng Việt), không còn crash khi mất mạng.
- Nhập được số cân thập phân (`25,5` hoặc `25.5`) qua `common.parseDecimal`; combobox đồng bộ chữ hiển thị khi giá trị đổi từ bên ngoài.
- `AddWeight` chỉ emit `weightAdded` sau khi lưu thành công, giữ dữ liệu khi lưu lỗi, hiển thị thông báo; expose `setFormValues`/`save`.
- Bảng và biểu đồ tải lại ngay sau khi thêm cân (một lần gọi `getDataFish`, `StatisticData` nhận prop `fishData`); DB trống hoặc API lỗi không còn làm treo màn hình; tìm kiếm/đổi số dòng quay về trang 1.

## Cập nhật 2026-09-26 — CRUD danh mục & sửa bản ghi cân (kế hoạch 03)
- Bật Vue Router (hash history): trang "Cân cá" (`/`) và "Danh mục" (`/#/danh-muc`), thanh điều hướng `AppNav`.
- Trang Danh mục: thêm/sửa tại chỗ/xóa loại cá và loại giỏ (trọng lượng giỏ nhập được `1,5`).
- Bấm vào một ô trên bảng cân để sửa hoặc xóa lần cân đó; bảng và biểu đồ tải lại sau khi lưu.
- Bỏ cache localStorage danh sách loại cá/loại giỏ trong form thêm cân.

## Cập nhật 2026-09-26 — Nhập liệu bằng giọng nói (kế hoạch 04)
- Nút micro trong "Thêm cân nặng": nói "trắm giỏ to 25,5 lưu", "34 lưu", "hủy"...; cá và giỏ được giữ giữa các lần cân; đọc xác nhận sau khi lưu (có công tắc).
- Mã trong `src/voice/`; hướng dẫn sử dụng trong README.
- Sau khi lưu (cả nhập tay) chỉ xóa số cân, giữ loại cá và giỏ.
- Chưa làm: kiểm thử trên điện thoại thật (Android Chrome, iPhone Safari) theo checklist của kế hoạch 04 Task 6.

## Cập nhật 2026-09-26 — Phiên cân & tính tiền (kế hoạch 05)
- Thanh phiên cân (chọn phiên, "Phiên mới" hỏi tên người mua, "Kết thúc phiên"); phiên đã kết thúc thì ẩn form thêm cân.
- Bảng cân hiển thị trọng lượng thực (đã trừ giỏ); tab "Tiền" nhập đơn giá, ra thành tiền/tổng tiền, "In phiếu"; tab "Biểu đồ".
- Form thêm cân hiện lý do lỗi từ server (ví dụ "Số cân phải lớn hơn trọng lượng giỏ (2 kg)!").

## Cập nhật 2026-09-26 — Nhật ký & đăng nhập (kế hoạch 06)
- Trang "Đăng nhập" (`/#/dang-nhap`), mọi trang khác cần đăng nhập; hết phiên thì báo "Phiên đăng nhập đã hết hạn" và quay lại đúng trang cũ sau khi đăng nhập; nút "Đăng xuất".
- Trang "Nhật ký" (`/#/nhat-ky`): lọc theo loại cá, phân trang, dòng lỗi tô đỏ.

## Cập nhật 2026-09-26 — Xóa form sau khi lưu
- Lưu số cân thành công (nhập tay hoặc giọng nói) thì xóa hết loại cá, loại giỏ và số cân; lần sau phải chọn/nói lại cá và giỏ. Lệnh "hủy" vẫn chỉ xóa số cân. (Thay cho hành vi "giữ cá và giỏ" ghi ở trên.)

## Cập nhật 2026-09-26 — Combobox mở khi bấm vào ô
- `ComboboxComponent`: bấm vào ô nhập (không chỉ mũi tên) là mở danh sách đầy đủ để chọn; đang mở thì bấm tiếp vẫn giữ mở để gõ lọc; combobox bị khóa thì không mở.

## Cập nhật 2026-09-26 — Loại tiền theo phiên
- Tab "Tiền" có ô chọn loại tiền (VND/USD) cho phiên; đổi khi đã có giá thì hỏi xác nhận vì server xóa bảng giá cũ.
- Ô đơn giá hiển thị theo loại tiền ("45.000" kèm "đ", "1.75" kèm "$"); tiêu đề cột, thành tiền, tổng và phiếu in theo loại tiền. Helper: `src/common/currency.js`.
- Cần BE có `updateSessionCurrency` (PR BE cùng tên nhánh `feature/session-currency`).
