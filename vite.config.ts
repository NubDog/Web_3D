import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //// Cấu hình proxy để có thể gọi API từ máy chủ back-end
  server: {
    proxy: {
      // Proxy các yêu cầu bắt đầu bằng '/api'
      "/api": {
        target: "http://127.0.0.1:8787", // Địa chỉ máy chủ back-end của bạn
        changeOrigin: true, // Thay đổi origin của yêu cầu
        rewrite: (path) => path.replace(/^\/api/, ""), // Xóa '/api' khỏi đường dẫn
      },
    },
  },
  //// Kết thúc cấu hình proxy
});
