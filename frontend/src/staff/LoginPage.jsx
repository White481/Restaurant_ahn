import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
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
    <div className="grid min-h-screen place-items-center bg-stone-50 px-4 text-stone-900">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <p className="text-4xl" aria-hidden="true">
            🍜
          </p>
          <h1 className="mt-1 text-xl font-bold">เข้าสู่ระบบพนักงาน</h1>
        </div>
        <label className={labelClass}>
          ชื่อผู้ใช้
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required className={inputClass} />
        </label>
        <label className={labelClass}>
          รหัสผ่าน
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
        <Link to="/" className="text-center text-sm text-stone-500 underline">
          ← กลับหน้าลูกค้า
        </Link>
      </form>
    </div>
  );
}
