# DroneDelivery System - Hướng dẫn chi tiết

Dự án này là hệ thống giao hàng bằng Drone mô phỏng, kết hợp giữa mạch phần cứng **ESP32** (gắn trên Drone) và **Ứng dụng React Native** (dành cho Admin, Drone Driver, và Người nhận hàng). Hệ thống sử dụng kết hợp **Socket.IO** (cho cập nhật vị trí thời gian thực) và **MQTT** (để truyền lệnh điều khiển Motor xuống bo mạch Drone).

Tài liệu này là hướng dẫn toàn diện từ cách thiết lập phần cứng, chạy Web/App, đến diễn giải quy trình giao hàng.

---

## 🏗️ 1. Cấu trúc Hệ thống

- **ESP32 (Hardware):** Kết nối WiFi, nhận bản tin MQTT, và giao tiếp với Flight Controller (INAV/Betaflight) qua giao thức MSP để điều khiển Motor.
- **Node.js Server:** Máy chủ trung tâm quản lý danh sách thiết bị online, tạo đơn hàng, và tính toán khoảng cách. Sử dụng WebSockets.
- **React Native App:** Có 3 vai trò (Role) chính khi đăng nhập:
  - **👨‍💼 ADMIN:** Theo dõi toàn bộ Drone và Điểm nhận trên bản đồ, tạo đơn hàng mới, gửi lệnh điều khiển.
  - **🚁 DRONE:** Điện thoại gắn kèm Drone (hoặc tự mô phỏng), cập nhật GPS liên tục lên Server.
  - **📍 DESTINATION (Điểm nhận):** Cập nhật vị trí người nhận, chờ Drone đến và hiển thị mã QR để nhận hàng.

---

## ⚙️ 2. Cài đặt và Cấu hình

### A. Thiết lập Firmware cho ESP32 lần đầu tiên
Để Motor quay được, bạn cần nạp code vào mạch ESP32 và đảm bảo nó kết nối được với chung mạng WiFi / Internet bằng cấu hình MQTT.

1. Mở file `esp32_drone/esp32_drone.ino` bằng Arduino IDE.
2. Tìm đến phần cấu hình WiFi và thay đổi tương ứng với mạng của bạn:
   ```cpp
   const char* ssid = "TEN_WIFI_CUA_BAN";
   const char* password = "MAT_KHAU_WIFI";
   ```
3. Cấu hình **MQTT Broker** (Mặc định đang dùng HiveMQ Cloud):
   ```cpp
   const char* mqtt_server     = "d130275373b6451bac4640918d94bb1c.s1.eu.hivemq.cloud";
   const int   mqtt_port       = 8883; // Chạy SSL (8883)
   const char* mqtt_user       = "esp32";
   const char* mqtt_pass       = "Esp323232";
   ```
4. Đảm bảo ESP32 nối dây chéo TX/RX với Flight Controller (FC) để truyền lệnh MSP.
5. Cắm cáp USB và bấm **Upload** trên Arduino IDE.
6. **Mở Serial Monitor (Baudrate 115200)**: Khi có kết nối thành công, bạn sẽ thấy log báo `[MQTT] Connected`.

---

### B. Chạy Server Node.js (Backend)
Máy chủ xử lý logic giao dịch và vị trí WebSocket.
```bash
# Di chuyển vào folder server
cd server

# Cài đặt thư viện
npm install

# Khởi động server (Server sẽ chạy ở cổng 3000)
node index.js
```
*Lưu ý: Nếu bạn test trên điện thoại thật, bạn CẦN expose port 3000 này ra internet (ví dụ dùng Cloudflare Tunnel hoặc ngrok) để điện thoại có thể kết nối được tới, vì điện thoại không thể hiểu `localhost`.*

---

### C. Chạy App React Native (Frontend)
Mở một Terminal mới (giữ Terminal của server vẫn đang chạy).
```bash
# Ở thư mục gốc của dự án
npm install

# Khởi động Expo
npm start
```
- Nhấn `w` để chạy trên Web Browser.
- Nhấn `a` để chạy máy ảo Android, hoặc mở ứng dụng **Expo Go** trên điện thoại thật và quét mã QR.

---

## 🚀 3. Luồng Giao Hàng Tiêu Chuẩn (Step-by-Step)

Dưới đây là kịch bản chuẩn để thử nghiệm thành công 1 đơn giao hàng hoàn chỉnh khiến motor quay và đổi trạng thái.

**Bước 1: Kết nối các thiết bị**
1. Bật nguồn máy bay (ESP32). Đảm bảo Serial Monitor báo MQTT Connected.
2. Mở App trên **Trình duyệt Web**, chọn Role là `ADMIN`. Nhấn Kết nối.
3. Mở App trên **Điện thoại 1** (hoặc tab web khác), chọn Role là `DRONE` với ID: `Drone-01`. (Cấp quyền chia sẻ vị trí).
4. Mở App trên **Điện thoại 2**, chọn Role là `DESTINATION` với ID: `Khach-01`.

**Bước 2: Giao nhiệm vụ (Admin)**
1. Màn hình ADMIN hiện bản đồ có Icon 👨‍💼 (Admin), 🚁 (Drone), và 📍 (Khách).
2. Admin bấm **+ Giao nhiệm vụ mới**.
3. Chọn Drone, Chọn Khách Hàng, Nhập tên món hàng và bấm **Gửi**.

**Bước 3: Drone cất cánh (Motor quay)**
1. Ngay khi Admin bấm gửi, Server ghi nhận đơn hàng.
2. App gọi hàm gửi lệnh JSON qua MQTT Topic `drone/fc/in`. 
   *Lệnh JSON: `{"cmd":"start_motor", "throttle":17}`*.
3. **ESP32 nhận lệnh:** Nó sẽ vào trạng thái Arming (giữ ga ở mức thấp 1000us) kèm bật công tắc ARM trong 1.5 giây để Flight Controller mở khóa an toàn. Sau 1.5s, ga sẽ tự động tăng lên 17% (mức chỉ định). Motor bắt đầu quay vòng vòng!

**Bước 4: Quá trình bay (Simulate)**
1. Thiết bị cầm tay đóng vai trò Drone bắt đầu di chuyển về phía Destination (Hoặc trên trình duyệt Web, bạn bấm chuột lên bản đồ để dời vị trí mô phỏng Drone bay).
2. Server liên tục tính toán khoảng cách. 
3. Khi khoảng cách < 500m, trạng thái chuyển thành `APPROACHING` (Đang đến gần).
4. Khi khoảng cách < 50m, trạng thái chuyển thành `ARRIVED` (Đã đến nơi). Giao diện của người nhận (Destination) lập tức chuyển sang màu Xanh lá.

**Bước 5: Trả hàng và Quét QR**
1. Người nhận (Destination) thấy nút "Quét mã để nhận hàng", bấm vào sẽ hiển thị một **Mã QR Code** to trên màn hình điện thoại.
2. Người lái Drone (Role DRONE) bấm vào "Đã đến, Quét QR người nhận". Camera bật lên, chĩa vào mã QR của Khách hàng.
3. Nếu quét khớp mã, hệ thống báo Thành công ✅. 
4. **Motor dừng quay:** Chuyển trạng thái sang DELIVERED, lệnh `stop_motor` được bắn qua MQTT, ESP32 hạ ga về 1000us và DISARM an toàn.

---

## 📡 4. Cách sử dụng MQTT trong Dự án

Dự án dùng giao thức MQTT làm luồng giao tiếp điều khiển thời gian thực siêu nhanh cho bo mạch phần cứng.
App React Native kết nối qua **WebSockets MQTT**, còn ESP32 kết nối qua **TCP MQTT SSL**.

### Các Topic đang dùng
- **`drone/fc/in`**: Nơi App gửi lệnh (JSON) cắm trực tiếp vào ESP32.
- **`drone/telemetry`**: Nơi ESP32 liên tục gửi trạng thái hiện tại của Motor (để App Admin theo dõi).
- **`drone/fc/out`**: Nơi xuất log nhị phân MSP phục vụ debug cho phần mềm Configurator.

### Các lệnh điều khiển (Gửi JSON vào `drone/fc/in`)

**Lệnh Khởi động Motor:**
Tự động kích hoạt quy trình ARM an toàn (1.5 giây) trước khi tăng ga.
```json
{
  "cmd": "start_motor",
  "lat": 10.798123, 
  "lon": 106.713456,
  "throttle": 17  // (mức % ga)
}
```

**Lệnh Dừng Motor (Disarm):**
```json
{
  "cmd": "stop_motor"
}
```

Tính năng tự ngắt Motor cũng được tích hợp vào nút **🛑 Hủy** của màn hình Admin. Khi Admin bấm hủy, đơn hàng bị xóa khỏi Server, và lệnh `stop_motor` cũng tự động được bắn tới Drone.
