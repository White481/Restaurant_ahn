import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// proxy: ตอน dev ทุก request ที่ขึ้นต้นด้วย /api จะถูกส่งต่อไปที่ backend (พอร์ต 3000)
// ข้อดี: frontend เรียก '/api/...' ได้เลยโดยไม่ต้องใส่ URL เต็ม และไม่ติดปัญหา CORS ตอนพัฒนา
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
