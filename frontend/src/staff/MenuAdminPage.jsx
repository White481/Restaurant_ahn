import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { useToast } from '../ui/Toast.jsx';
import { formatBaht } from '../components/status.js';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';

// จัดการเมนู (เฉพาะ admin): ดูรายการ + เพิ่มเมนูใหม่
export default function MenuAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [menus, setMenus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ item_name: '', category: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMenus(await api.getMenus());
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.createMenu({
        item_name: form.item_name.trim(),
        category: form.category.trim() || undefined,
        price: Number(form.price)
      });
      setForm({ item_name: '', category: '', price: '' });
      toast.success('เพิ่มเมนูเรียบร้อย');
      await load();
    } catch (e) {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return;
      }
      toast.error(e.status === 403 ? 'ต้องเป็น admin เท่านั้น' : e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StaffLayout title="จัดการเมนู">
      <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-4 dark:bg-stone-900">
          <h2 className="text-lg font-bold">เพิ่มเมนูใหม่</h2>
          <label className={labelClass}>
            ชื่อเมนู
            <input value={form.item_name} onChange={update('item_name')} maxLength={100} required className={inputClass} />
          </label>
          <label className={labelClass}>
            หมวดหมู่
            <input value={form.category} onChange={update('category')} maxLength={50} placeholder="เช่น Main, Drink" className={inputClass} />
          </label>
          <label className={labelClass}>
            ราคา (บาท)
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required className={inputClass} />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'กำลังบันทึก...' : 'เพิ่มเมนู'}
          </Button>
        </form>

        <section className="rounded-2xl bg-white p-4 dark:bg-stone-900" aria-label="รายการเมนูทั้งหมด">
          <h2 className="mb-2 text-lg font-bold">เมนูทั้งหมด{menus ? ` (${menus.length})` : ''}</h2>
          {menus === null && !loadError && <Skeleton className="h-40" />}
          {loadError && (
            <EmptyState icon="⚠️" title="โหลดเมนูไม่สำเร็จ" hint={loadError}>
              <Button onClick={load}>ลองใหม่</Button>
            </EmptyState>
          )}
          {menus && (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {menus.map((m) => (
                <li key={m.menu_item_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.item_name}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{m.category || 'อื่นๆ'}</p>
                  </div>
                  <strong>{formatBaht(m.price)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
