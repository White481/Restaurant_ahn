import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';

// สวิตช์ "ลูกค้า | พนักงาน" มุมขวาบนของทุกหน้า (กรอบเส้นส้มแบบ segmented ตาม mockup)
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
      className={`flex min-h-8 items-center px-3 text-xs font-bold tracking-wide transition ${
        active
          ? 'bg-brand-600 text-white dark:bg-brand-500'
          : 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      aria-label={t('mode.aria')}
      className="inline-flex shrink-0 overflow-hidden rounded-lg border border-brand-600 dark:border-brand-500"
    >
      {item('/', t('mode.customer'), !inStaff)}
      {item('/staff', t('mode.staff'), inStaff)}
    </nav>
  );
}
