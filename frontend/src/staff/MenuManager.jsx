import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';

// จัดการเมนู (เฉพาะ admin): ดูรายการ + เพิ่มเมนูใหม่
export default function MenuManager({ onUnauthorized }) {
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState({ item_name: '', category: '', price: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMenus(await api.getMenus());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.createMenu({
        item_name: form.item_name.trim(),
        category: form.category.trim() || undefined,
        price: Number(form.price)
      });
      setForm({ item_name: '', category: '', price: '' });
      setMessage('เพิ่มเมนูเรียบร้อย');
      await load();
    } catch (e) {
      if (e.status === 401) return onUnauthorized();
      setError(e.status === 403 ? 'ต้องเป็น admin เท่านั้น' : e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid-2">
      <form onSubmit={handleSubmit} className="card form">
        <h2>เพิ่มเมนูใหม่</h2>
        <label>
          ชื่อเมนู
          <input value={form.item_name} onChange={update('item_name')} maxLength={100} required />
        </label>
        <label>
          หมวดหมู่
          <input value={form.category} onChange={update('category')} maxLength={50} placeholder="เช่น Main, Drink" />
        </label>
        <label>
          ราคา (บาท)
          <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
        </label>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : 'เพิ่มเมนู'}
        </button>
      </form>

      <div className="card">
        <h2>เมนูทั้งหมด ({menus.length})</h2>
        <ul className="menu-list compact">
          {menus.map((m) => (
            <li key={m.menu_item_id} className="menu-item">
              <div>
                <div className="menu-name">{m.item_name}</div>
                <div className="muted small">{m.category || 'อื่นๆ'}</div>
              </div>
              <strong>{formatBaht(m.price)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
