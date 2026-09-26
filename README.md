# management-fish

Sổ cân cá điện tử — giao diện Vue 3 + Vite.

## Chạy dự án

```
npm install
npm run dev        # http://localhost:3001
npm test           # Vitest
npm run build
npm run deploy     # build + đẩy lên GitHub Pages
```

## Nhập bằng giọng nói

Ở khung "Thêm cân nặng", bấm nút micro **một lần** rồi cứ nói, không cần chạm tay. Nút đỏ nhấp nháy là app đang nghe. Bấm lại để tắt.

**Cú pháp câu nói.** Thứ tự tự do, phần nào cũng có thể bỏ:

```
[cá] <tên loại cá>   [giỏ] <tên loại giỏ>   <số cân> [cân | ký | kg]   [lưu | xong | hủy | sai | làm lại]
```

| Câu nói | Kết quả |
|---|---|
| "cá trắm giỏ to 25,5 lưu" | Điền trắm, giỏ to, 25,5 rồi lưu |
| "trắm hai mươi lăm phẩy năm" | Điền trắm và 25,5, chờ nói "lưu" |
| "ba mươi tư cân lưu" | Lưu 34 cân với loại cá và giỏ đang chọn |
| "hai lăm rưỡi lưu" | Lưu 25,5 cân |
| "ba cân hai lạng lưu" | Lưu 3,2 cân |
| "giỏ nhỏ" | Chỉ đổi loại giỏ |
| "hủy" | Xóa số cân đang chờ, giữ loại cá và giỏ |

- Loại cá và loại giỏ được **giữ lại** giữa các lần cân. Mỗi lần chỉ cần nói số cân rồi "lưu".
- Thiếu thông tin thì app **không lưu** mà báo thiếu gì ("Chưa có số cân", "Chưa chọn loại cá", "Chưa chọn loại giỏ").
- Tên cá và giỏ được khớp với trang **Danh mục**, không phân biệt dấu và hoa thường. Có thể nói cả tên đầy đủ ("cá trắm") hoặc tên ngắn ("trắm").
- Công tắc **Đọc xác nhận** (mặc định bật): sau mỗi lần lưu bằng giọng nói, app đọc lại, ví dụ "Đã lưu trắm 25,5 cân". Nếu máy không có giọng đọc tiếng Việt thì app phát một tiếng bíp.

**Trình duyệt hỗ trợ:** Chrome/Edge (máy tính, Android) và Safari trên iPhone (iOS 14.5 trở lên). Firefox chưa hỗ trợ; khi đó nút micro bị ẩn và vẫn nhập tay bình thường. Nhận dạng giọng nói cần có mạng, và trang phải chạy qua HTTPS (GitHub Pages) hoặc `localhost`. Lần đầu bấm micro, trình duyệt sẽ hỏi quyền dùng micro.
