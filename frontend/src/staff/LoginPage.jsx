import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LangSwitch from '../components/LangSwitch.jsx';
import ModeSwitch from '../components/ModeSwitch.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import Wordmark from '../ui/Wordmark.jsx';
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
    <div className="flex min-h-screen flex-col bg-paper text-stone-950">
      <header className="flex items-center justify-end gap-4 px-4 py-3">
        <LangSwitch />
        <ModeSwitch />
      </header>

      <main className="grid flex-1 place-items-center px-4 pb-16">
        <div className="rise-in w-full max-w-sm">
          <div className="mb-6 text-center">
            <Wordmark size="lg" />
            <p className="eyebrow mt-3">Staff only</p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-stone-300 bg-stone-50 p-6 shadow-[0_24px_50px_-30px_rgb(42_33_27/0.5)]"
          >
            <h1 className="font-display text-2xl font-bold">{t('login.title')}</h1>
            <div className="rule-diamond mb-1" />
            <label className={labelClass}>
              {t('login.username')}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              {t('login.password')}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </label>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-chili-100 px-3 py-2 text-sm font-medium text-chili-700">
                <Icon name="alert" className="mt-0.5 size-4" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={submitting} className="mt-1">
              {submitting ? t('login.submitting') : t('login.submit')}
              {!submitting && <Icon name="arrow" className="size-4" />}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
