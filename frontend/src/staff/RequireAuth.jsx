import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// ครอบหน้าที่ต้อง login (และจำกัด role ได้ด้วย roles={['admin']})
// หมายเหตุ: นี่คือการ "ซ่อนหน้า" เพื่อความสะดวกของ user เท่านั้น ความปลอดภัยจริงอยู่ที่ backend (requireAuth) ซึ่งตรวจ token ทุก request
export default function RequireAuth({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/staff/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/staff" replace />;
  return children;
}
