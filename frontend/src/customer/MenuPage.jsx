import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import { useCart } from './CartContext.jsx';

export default function MenuPage() {
  const [params] = useSearchParams();
  const { items, tableId, setTableId, addItem, setQuantity, totalQty, totalPrice } = useCart();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // QR code ที่โต๊ะ = ลิงก์ /?table=3  -> เก็บหมายเลขโต๊ะไว้ใช้ตอนสั่ง
  useEffect(() => {
    const t = Number.parseInt(params.get('table'), 10);
    if (Number.isInteger(t) && t > 0) setTableId(t);
  }, [params, setTableId]);

  useEffect(() => {
    let active = true; // กัน setState หลัง component ถูกปิดไปแล้ว
    api
      .getMenus()
      .then((data) => active && setMenus(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const groups = {};
    for (const menu of menus) {
      const key = menu.category || 'อื่นๆ';
      (groups[key] ||= []).push(menu);
    }
    return groups;
  }, [menus]);

  const qtyOf = (id) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  return (
    <div className="page customer">
      <header className="topbar">
        <h1>เมนูอาหาร</h1>
        {tableId ? <span className="chip">โต๊ะ {tableId}</span> : <span className="chip chip-warn">ยังไม่ระบุโต๊ะ</span>}
      </header>

      {loading && <p className="muted">กำลังโหลดเมนู...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && menus.length === 0 && <p className="muted">ยังไม่มีเมนู</p>}

      {Object.entries(grouped).map(([category, list]) => (
        <section key={category}>
          <h2 className="category">{category}</h2>
          <ul className="menu-list">
            {list.map((menu) => {
              const qty = qtyOf(menu.menu_item_id);
              return (
                <li key={menu.menu_item_id} className="menu-item">
                  <div>
                    <div className="menu-name">{menu.item_name}</div>
                    <div className="menu-price">{formatBaht(menu.price)}</div>
                  </div>
                  {qty === 0 ? (
                    <button className="btn btn-primary" onClick={() => addItem(menu)}>
                      เพิ่ม
                    </button>
                  ) : (
                    <div className="stepper">
                      <button aria-label={`ลด ${menu.item_name}`} onClick={() => setQuantity(menu.menu_item_id, qty - 1)}>
                        −
                      </button>
                      <span>{qty}</span>
                      <button aria-label={`เพิ่ม ${menu.item_name}`} onClick={() => setQuantity(menu.menu_item_id, qty + 1)}>
                        +
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="page-footer">
        <Link to="/staff/login">สำหรับพนักงาน</Link>
      </footer>

      {totalQty > 0 && (
        <Link to="/cart" className="cart-bar">
          <span>ดูตะกร้า ({totalQty} รายการ)</span>
          <strong>{formatBaht(totalPrice)}</strong>
        </Link>
      )}
    </div>
  );
}
