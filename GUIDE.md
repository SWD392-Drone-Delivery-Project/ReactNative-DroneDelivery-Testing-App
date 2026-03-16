# Quick Start Guide

Tài liệu này là phiên bản rút gọn giúp bạn khởi chạy dự án nhanh chóng. Xin vui lòng xem file `README.md` mới nhất để biết chi tiết luồng hoạt động và cách cấu hình Motor / ESP32.

### 1. Cài đặt Server
```bash
cd server
npm install
node index.js
```

### 2. Cài đặt App
Mở một cửa sổ dòng lệnh khác ở thư mục ngoài cùng.
```bash
npm install
npm start
```
- Ấn `w` để chạy Web.
- Quét mã QR bằng app Expo Go để chạy thật trên điện thoại.

### 3. Cấu hình IP Mạng
Khi ứng dụng bật lên, bạn sẽ thấy ô nhập "Server URL". 
- Nếu bạn chạy Web và Server trên cùng 1 máy tính: điền `http://localhost:3000`.
- Nếu bạn chạy App trên điện thoại: Bạn bắt buộc phải **thay localhost** thành IP LAN của máy tính (vd: `http://192.168.1.5:3000`) hoặc đường link Tunnel (ngrok / cloudflare). Nếu không, điện thoại sẽ báo lỗi `xhr poll error`.

Dự án có ba vai trò chính: Điền ID túy ý và chọn vai trò: **ADMIN**, **DRONE**, hoặc **DESTINATION**.

### Gặp sự cố kết nối?
- Server báo chạy ở port 3000 nhưng điện thoại không vào được? Hãy tắt Tường lửa (Firewall) trên máy tính hoặc sử dụng lệnh Cloudflared: `cloudflared tunnel --url http://localhost:3000` và copy dãy link HTTPS đó bỏ vào ô Server URL trên App.
- Motor trên Drone không quay? Hãy mở Serial Monitor của Arduino IDE xem có in ra lỗi báo giải mã JSON (`JSON parse error`) không, và đảm bảo WiFi được cấu hình đúng chuẩn. Motor chỉ thực sự quay khi qua giai đoạn 1.5 giây an toàn.
