import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// ครอบหน้าที่ต้อง login: ถ้ายังไม่ login ส่งไปหน้า login
// หมายเหตุ: นี่คือการ "ซ่อนหน้า" เพื่อความสะดวกของ user เท่านั้น ความปลอดภัยจริงอยู่ที่ backend (requireAuth) ซึ่งตรวจ token ทุก request
export default function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/staff/login" replace />;
  return children;
}
