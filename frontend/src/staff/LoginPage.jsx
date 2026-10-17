import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/staff" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/staff', { replace: true });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow">
      <form onSubmit={handleSubmit} className="card form">
        <h1>เข้าสู่ระบบพนักงาน</h1>
        <label>
          ชื่อผู้ใช้
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label>
          รหัสผ่าน
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <Link to="/" className="muted center">
          ← กลับหน้าลูกค้า
        </Link>
      </form>
    </div>
  );
}
