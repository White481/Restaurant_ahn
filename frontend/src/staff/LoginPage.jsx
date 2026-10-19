import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import LangSwitch from '../components/LangSwitch.jsx';
import ModeSwitch from '../components/ModeSwitch.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import Button from '../ui/Button.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { useAuth } from './AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
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
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <Link to="/" className="truncate text-lg font-bold text-brand-700">
          🍜 Restaurant OMS
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LangSwitch />
          <ModeSwitch />
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-4 py-8">
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-md">
          <div className="text-center">
            <p className="text-4xl" aria-hidden="true">
              🍜
            </p>
            <h1 className="mt-1 text-xl font-bold">{t('login.title')}</h1>
          </div>
          <label className={labelClass}>
            {t('login.username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required className={inputClass} />
          </label>
          <label className={labelClass}>
            {t('login.password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </main>
    </div>
  );
}
