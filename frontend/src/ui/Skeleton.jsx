// กล่องเทาๆ กะพริบ แสดงระหว่างรอข้อมูล (ดีกว่าหน้าว่างหรือข้อความ "กำลังโหลด")
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800 ${className}`} />;
}
