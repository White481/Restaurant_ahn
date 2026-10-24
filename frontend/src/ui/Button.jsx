// ปุ่มมาตรฐานของทั้งแอป (ขนาดกดสบายด้วยนิ้ว: ต่ำสุด 44px ที่ขนาด md ขึ้นไป)
const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition select-none ' +
  'active:translate-y-px disabled:opacity-45 disabled:active:translate-y-0';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  dark: 'bg-espresso text-stone-50 hover:bg-stone-900 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white',
  secondary:
    'border border-stone-300 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white ' +
    'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-600 dark:hover:bg-stone-800',
  ghost: 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-50',
  danger:
    'border border-chili-100 text-chili-700 hover:border-chili-300 hover:bg-chili-100/60 ' +
    'dark:border-chili-900 dark:text-chili-300 dark:hover:bg-chili-900/50',
  dangerSolid: 'bg-chili-700 text-white hover:bg-chili-500'
};

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-12 px-5 text-base'
};

// ใช้กับ <Link> ที่ต้องการหน้าตาเป็นปุ่มได้ด้วย: className={buttonClasses('primary', 'lg')}
export function buttonClasses(variant = 'primary', size = 'md') {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...props} />;
}
