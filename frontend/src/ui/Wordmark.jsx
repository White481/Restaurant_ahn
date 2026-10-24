import { Link } from 'react-router-dom';
import { SHOP } from '../config/shop.js';

// โลโก้ตัวอักษรของร้าน (ตัวหนังสือ serif สีส้มพริก) ใช้ทั้งฝั่งลูกค้าและพนักงาน
export default function Wordmark({ to = '/', size = 'md', className = '' }) {
  const text = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl';
  return (
    <Link
      to={to}
      className={`whitespace-nowrap font-display font-extrabold italic leading-none tracking-tight text-brand-600 dark:text-brand-400 ${text} ${className}`}
    >
      {SHOP.name}
    </Link>
  );
}
