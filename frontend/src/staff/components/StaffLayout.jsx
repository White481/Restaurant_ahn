import { Link, NavLink, useNavigate } from 'react-router-dom';
import Button from '../../ui/Button.jsx';
import LangSwitch from '../../components/LangSwitch.jsx';
import ModeSwitch from '../../components/ModeSwitch.jsx';
import { useNow } from '../../hooks/useNow.js';
import { useTheme } from '../../hooks/useTheme.js';
import { formatTime } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

// รายการเมนูนำทาง: เพิ่มหน้าใหม่ (Stocks / Employees / Reports) ที่นี่เมื่อ backend มี API รองรับ
const NAV = [
  { to: '/staff', labelKey: 'staff.nav.orders', icon: '🧾', end: true },
  { to: '/staff/menu', labelKey: 'staff.nav.menu', icon: '📋', roles: ['admin'] }
];

// โครงหน้าฝั่งพนักงาน: Sidebar (จอใหญ่) / แถบนำทางล่างจอ (มือถือ) + แถบบน (นาฬิกา ธีม ผู้ใช้ ภาษา)
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

  const linkClass = ({ isActive }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800'
    }`;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:flex">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 md:flex">
        <Link to="/staff" className="mb-4 px-3 py-2 text-lg font-bold text-brand-700 dark:text-brand-300">
          🍜 Restaurant OMS
        </Link>
        <nav aria-label={t('staff.nav.aria')} className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <span aria-hidden="true">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold">{title}</h1>
            <span className="text-sm tabular-nums text-stone-500 dark:text-stone-400">{formatTime(now, lang)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerRight}
            <ThemeToggle choice={theme.choice} onChange={theme.setChoice} />
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm dark:bg-stone-800">
              {user.username} · {user.role}
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              {t('staff.logout')}
            </Button>
            <LangSwitch />
            <ModeSwitch />
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:pb-6">{children}</main>
      </div>

      <nav
        aria-label={t('staff.nav.ariaMobile')}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-stone-800 dark:bg-stone-900 md:hidden"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <span className="text-xl" aria-hidden="true">
              {item.icon}
            </span>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
