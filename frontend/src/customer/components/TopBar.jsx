import { Link } from 'react-router-dom';
import ModeSwitch from '../../components/ModeSwitch.jsx';

// แถบหัวฝั่งลูกค้า: ชื่อร้าน (ซ้าย) + หมายเลขโต๊ะเป็นบรรทัดรอง, สวิตช์ ลูกค้า|พนักงาน (ขวาบน)
// tableId: ตัวเลข = แสดงโต๊ะ, null = เตือนว่ายังไม่ระบุโต๊ะ, undefined = ไม่แสดง (เช่น หน้าติดตามออเดอร์)
export default function TopBar({ tableId }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <Link to="/" className="block truncate text-lg font-bold text-brand-700">
          🍜 Restaurant OMS
        </Link>
        {tableId === null && <p className="text-sm font-semibold text-red-700">ยังไม่ระบุโต๊ะ</p>}
        {typeof tableId === 'number' && <p className="text-sm font-semibold text-brand-800">โต๊ะ {tableId}</p>}
      </div>
      <ModeSwitch />
    </div>
  );
}
