# HandPlay (Phiên Bản Tiếng Việt) 🎮✋

**HandPlay** là bộ trò chơi tương tác thú vị điều khiển hoàn toàn bằng **cử chỉ bàn tay** qua Webcam máy tính, sử dụng công nghệ thị giác máy tính **Google MediaPipe** và nền tảng **Electron**.

> 🌐 **Dự án gốc:** [erickscaraujo/HandPlay](https://github.com/erickscaraujo/HandPlay)  
> 🇻🇳 **Bản Việt hóa & Tối ưu:** Toàn bộ giao diện, hướng dẫn, hệ thống thành tựu, cài đặt, mini-game và thông báo đã được chuyển ngữ sang Tiếng Việt chuẩn mực, mượt mà.

---

## 🚀 Cách Khởi Động Trò Chơi Nhanh Nhất

Người dùng có thể khởi chạy trò chơi bằng 1 cú nhấp chuột đơn giản:

1. **Cách 1 (Nhanh nhất):** Nhấp đúp vào file **`Chạy HandPlay.bat`** tại thư mục `D:\Game\` (hoặc trong thư mục `HandPlay`).
2. **Cách 2:** Mở trực tiếp file thực thi **`D:\Game\HandPlay-App\HandPlay.exe`**.

---

## 🕹️ Danh Sách 8 Trò Chơi Hấp Dẫn

1. **🧩 Xếp Hình Cử Chỉ (Gesture Puzzle)**:
   - Dùng cử chỉ chụm ngón tay (Pinch) để nhấc và kéo thả các mảnh ghép vào đúng vị trí trên lưới 3x3 trước khi hết giờ.
2. **🎯 Thợ Săn Mục Tiêu (Target Hunter)**:
   - Di chuyển ngón tay để nhắm tâm ngắm và chụm ngón tay để bắn trúng các bia mục tiêu đổi màu.
3. **🎈 Bắn Bóng Bay (Balloon Pop)**:
   - Dùng ngón trỏ chạm hoặc mở lòng bàn tay để làm nổ các quả bóng bay rực rỡ, tích lũy điểm combo.
4. **🏓 Bóng Bàn Không Khí (Air Pong)**:
   - Di chuyển bàn tay lên xuống để điều khiển thanh đỡ phản xạ bóng trước đối thủ máy AI.
5. **🧠 Trí Nhớ Siêu Phàm (Memory Hands)**:
   - Dùng cử chỉ chụm ngón tay để lật và ghi nhớ từng cặp biểu tượng giống nhau qua nhiều cấp độ.
6. **⚡ Né Tránh Chướng Ngại (Dodge Hand)**:
   - Di chuyển bàn tay để điều khiển điểm sáng né tránh các chướng ngại vật bay tới từ 4 phía.
7. **🏃 Đường Chạy Không Gian (Air Runner)**:
   - Vuốt tay lên hoặc mở lòng bàn tay để nhảy qua chướng ngại; nắm tay lại hoặc hạ thấp bàn tay để cúi người trượt; nhặt thật nhiều đồng xu trên đường chạy.
8. **🎨 Vẽ Tranh Trên Không (Air Draw)**:
   - Dùng ngón trỏ vẽ tranh tự do trong không gian, đổi công cụ (bút vẽ, tẩy, xóa sạch, hoàn tác) và lưu tác phẩm thành file ảnh PNG về máy.

---

## ✋ Bảng Hướng Dẫn Cử Chỉ Tay

| Cử chỉ | Hình minh họa | Hành động trong trò chơi |
| :--- | :---: | :--- |
| **Chụm ngón (Pinch)** | 🤏 | Nhấp chọn menu, gắp mảnh ghép, bắn mục tiêu, lật thẻ |
| **Mở lòng bàn tay** | 🖐️ | Nhảy trong Air Runner, nổ bóng nhanh, tương tác diện rộng |
| **Nắm đấm (Fist)** | ✊ | Cúi người/trượt trong Air Runner, tạm dừng nhanh |
| **Ngón trỏ (Index Point)** | ☝️ | Di chuyển con trỏ ảo, vẽ tranh, chọc bóng bay |
| **Vuốt tay (Swipe)** | 👋 | Nhảy hoặc chuyển đổi nhanh |

> 💡 **Lưu ý về quyền riêng tư & bảo mật**: Toàn bộ luồng nhận diện MediaPipe được xử lý **100% cục bộ (On-device)** trực tiếp trên CPU/GPU máy bạn. Không có bất kỳ hình ảnh hay video nào được gửi lên internet.
> 
> 💡 **Chế độ không có Camera (Dự phòng)**: Nếu máy tính chưa gắn camera hoặc chưa cấp quyền, HandPlay tự động hỗ trợ điều khiển bằng **chuột và phím tắt** (Phím cách để Chụm/Chọn, Mũi tên lên để Nhảy, Mũi tên xuống để Cúi).

---

## 🌟 Các Tính Năng Nổi Bật Khác

- **🎨 7 Giao Diện Màu Sắc Đa Dạng**: Đêm Tím Indigo, Xanh Ma Trận Cyber, Lửa Đỏ Rực, Đại Dương Xanh, Hoàng Kim Hổ Phách, Hồng Hoa Hồng, Đơn Sắc Hiện Đại.
- **🏆 24 Thành Tựu Phong Phú**: Mở khóa danh hiệu khi đạt các mốc kỷ lục, chuỗi combo và thời gian luyện tập.
- **📊 Bảng Thống Kê & Phân Tích (Analytics)**: Theo dõi biểu đồ tần suất chơi, tổng điểm, độ chính xác và lịch sử từng ván.
- **🎯 4 Mức Độ Khó**: Dễ, Bình Thường, Khó, Cực Hạn (điều chỉnh tốc độ và hệ số điểm thưởng).
- **🛠️ Phòng Thử Nghiệm (Tracking Lab)**: Xem trực tiếp khung nhận diện bàn tay (Landmarks), tốc độ xử lý FPS và độ trễ.
- **💾 Sao Lưu & Khôi Phục (Backup & Restore)**: Xuất toàn bộ dữ liệu kỷ lục và cài đặt ra file JSON để lưu trữ hoặc chuyển sang máy khác.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
D:\Game\
├── Chạy HandPlay.bat              # Phím tắt khởi động nhanh trò chơi
├── HandPlay-App\                  # Ứng dụng Desktop chạy độc lập
│   ├── HandPlay.exe               # File chạy chính của trò chơi
│   └── resources\app.asar         # Gói mã nguồn đã Việt hóa
├── HandPlay\                      # Mã nguồn Git đầy đủ
│   ├── src\                       # Giao diện HTML/CSS/JS Việt hóa
│   │   ├── index.html
│   │   ├── js\games\              # Mã nguồn 8 mini-game
│   │   └── ...
│   ├── electron\                  # Tiến trình Electron chính
│   ├── resources\                 # Model AI MediaPipe, âm thanh, icon
│   ├── Chạy HandPlay.bat
│   └── README_VI.md               # Tài liệu hướng dẫn Tiếng Việt
```

---
*Chúc bạn có những giờ phút giải trí và rèn luyện phản xạ thú vị cùng HandPlay!*
