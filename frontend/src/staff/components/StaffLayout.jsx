import { NavLink, useNavigate } from 'react-router-dom';
import LangSwitch from '../../components/LangSwitch.jsx';
import ModeSwitch from '../../components/ModeSwitch.jsx';
import Icon from '../../ui/Icon.jsx';
import Wordmark from '../../ui/Wordmark.jsx';
import { useNow } from '../../hooks/useNow.js';
import { useTheme } from '../../hooks/useTheme.js';
import { formatTime } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

// รายการเมนูนำทาง: เพิ่มหน้าใหม่ (Stocks / Employees / Reports) ที่นี่เมื่อ backend มี API รองรับ
const NAV = [
  { to: '/staff', labelKey: 'staff.nav.orders', icon: 'receipt', end: true },
  { to: '/staff/menu', labelKey: 'staff.nav.menu', icon: 'list', roles: ['admin'] },
  { to: '/staff/dashboard', labelKey: 'staff.nav.dashboard', icon: 'chart', roles: ['admin'] }
];

// โครงหน้าฝั่งพนักงาน: แถบบน (โลโก้ + แท็บนำทาง + ภาษา) / แถบข้อมูล (ชื่อหน้า นาฬิกา ผู้ใช้) / แถบนำทางล่างจอบนมือถือ
export default function StaffLayout({ title, headerRight, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const theme = useTheme(); // ผูกธีมกับหน้าฝั่งพนักงานเท่านั้น
  const now = useNow(30000);
  const items = NAV.filter((item) => !item.roles || item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/staff/login', { replace: true });
  };

  const tabClass = ({ isActive }) =>
    `relative flex min-h-14 items-center gap-2 px-3 text-[13px] font-bold tracking-wide transition ${
      isActive
        ? 'text-brand-600 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-brand-600 dark:text-brand-400 dark:after:bg-brand-400'
        : 'text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50'
    }`;

  return (
    <div className="min-h-screen bg-paper text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <header className="border-b border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4">
          <div className="flex items-baseline gap-2 py-3">
            <Wordmark to="/staff" size="sm" />
            <span className="eyebrow hidden sm:inline">Staff</span>
          </div>
          <nav aria-label={t('staff.nav.aria')} className="hidden items-stretch md:flex">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
                <Icon name={item.icon} className="size-4" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <LangSwitch />
            <ModeSwitch />
          </div>
        </div>
      </header>

      <div className="border-b border-stone-300 bg-stone-200/60 dark:border-stone-800 dark:bg-stone-900/50">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl font-bold leading-none">{title}</h1>
            <span className="text-sm tabular-nums text-stone-500 dark:text-stone-400">{formatTime(now, lang)}</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {headerRight}
            <ThemeToggle choice={theme.choice} onChange={theme.setChoice} />
            <span className="flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 py-1 pl-1 pr-3 text-sm dark:border-stone-700 dark:bg-stone-900">
              <span className="grid size-6 place-items-center rounded-md bg-espresso text-[11px] font-bold uppercase text-stone-50 dark:bg-stone-700">
                {user.username.slice(0, 1)}
              </span>
              <span className="font-semibold">{user.username}</span>
              <span className="eyebrow">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t('staff.logout')}
              title={t('staff.logout')}
              className="grid size-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-300/60 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
            >
              <Icon name="logout" className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] p-4 pb-24 md:pb-8 md:pt-6">{children}</main>

      <nav
        aria-label={t('staff.nav.ariaMobile')}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-300 bg-stone-50 pb-[env(safe-area-inset-bottom)] dark:border-stone-800 dark:bg-stone-900 md:hidden"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold tracking-wide ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <Icon name={item.icon} className="size-5" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
