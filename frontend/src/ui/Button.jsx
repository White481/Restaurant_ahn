// ปุ่มมาตรฐานของทั้งแอป (ขนาดกดสบายด้วยนิ้ว: ต่ำสุด 44px ที่ขนาด md ขึ้นไป)
const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
  'disabled:opacity-50';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 ' +
    'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700',
  ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  danger:
    'border border-red-300 text-red-700 hover:bg-red-50 ' +
    'dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
};

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-5 text-lg'
};

// ใช้กับ <Link> ที่ต้องการหน้าตาเป็นปุ่มได้ด้วย: className={buttonClasses('primary', 'lg')}
export function buttonClasses(variant = 'primary', size = 'md') {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...props} />;
}
