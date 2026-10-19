import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';

// สวิตช์แคปซูล "ลูกค้า | พนักงาน" มุมขวาบนของทุกหน้า
// - ลูกค้า: ไม่ต้อง login (ไปหน้าเมนู)
// - พนักงาน: ไปหน้า /staff ถ้ายังไม่ login RequireAuth จะพาไปหน้า login ให้เอง (login แล้วก็เข้ากระดานเลย)
export default function ModeSwitch() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const inStaff = pathname === '/staff' || pathname.startsWith('/staff/');

  const item = (to, label, active) => (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition ${
        active
          ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-100 dark:text-stone-900'
          : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav aria-label={t('mode.aria')} className="inline-flex shrink-0 rounded-full bg-stone-200 p-1 dark:bg-stone-800">
      {item('/', t('mode.customer'), !inStaff)}
      {item('/staff', t('mode.staff'), inStaff)}
    </nav>
  );
}
