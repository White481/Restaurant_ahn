import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import { useCart } from './CartContext.jsx';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, tableId, setTableId, setQuantity, clear, totalPrice } = useCart();
  const [orderType, setOrderType] = useState('dine_in');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [tableInput, setTableInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="page customer">
        <header className="topbar">
          <h1>ตะกร้า</h1>
        </header>
        <p className="muted">ยังไม่มีรายการในตะกร้า</p>
        <Link className="btn btn-primary" to="/">
          กลับไปเลือกเมนู
        </Link>
      </div>
    );
  }

  const effectiveTable = tableId || Number.parseInt(tableInput, 10) || null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!effectiveTable) {
      setError('กรุณาระบุหมายเลขโต๊ะ');
      return;
    }

    const payload = {
      table_id: effectiveTable,
      order_type: orderType,
      items: items.map(({ menu_item_id, quantity }) => ({ menu_item_id, quantity }))
    };
    if (paymentMethod) payload.payment_method = paymentMethod;
    if (note.trim()) payload.special_request = note.trim();

    setSubmitting(true); // กันกดซ้ำจนได้ออเดอร์สองใบ
    try {
      const result = await api.createOrder(payload);
      if (!tableId) setTableId(effectiveTable);
      clear();
      navigate(`/order/${result.order_id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="page customer">
      <header className="topbar">
        <h1>ตะกร้า</h1>
        <Link to="/">← เมนู</Link>
      </header>

      <ul className="menu-list">
        {items.map((item) => (
          <li key={item.menu_item_id} className="menu-item">
            <div>
              <div className="menu-name">{item.item_name}</div>
              <div className="menu-price">
                {formatBaht(item.price)} × {item.quantity} = {formatBaht(item.price * item.quantity)}
              </div>
            </div>
            <div className="stepper">
              <button aria-label={`ลด ${item.item_name}`} onClick={() => setQuantity(item.menu_item_id, item.quantity - 1)}>
                −
              </button>
              <span>{item.quantity}</span>
              <button aria-label={`เพิ่ม ${item.item_name}`} onClick={() => setQuantity(item.menu_item_id, item.quantity + 1)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="card form">
        <fieldset>
          <legend>ประเภทออเดอร์</legend>
          <label className="radio">
            <input type="radio" name="orderType" value="dine_in" checked={orderType === 'dine_in'} onChange={() => setOrderType('dine_in')} />
            ทานที่ร้าน
          </label>
          <label className="radio">
            <input type="radio" name="orderType" value="take_away" checked={orderType === 'take_away'} onChange={() => setOrderType('take_away')} />
            กลับบ้าน
          </label>
        </fieldset>

        {tableId ? (
          <p className="muted">โต๊ะ {tableId}</p>
        ) : (
          <label>
            หมายเลขโต๊ะ
            <input type="number" min="1" inputMode="numeric" value={tableInput} onChange={(e) => setTableInput(e.target.value)} placeholder="เช่น 1" />
          </label>
        )}

        <label>
          วิธีชำระเงิน
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">เลือกตอนจ่ายเงิน</option>
            <option value="cash">เงินสด</option>
            <option value="card">บัตร</option>
            <option value="qr">QR</option>
          </select>
        </label>

        <label>
          ข้อความถึงครัว (ไม่บังคับ)
          <textarea rows="3" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น เผ็ดน้อย ไม่ใส่ผัก" />
        </label>

        <div className="total-row">
          <span>รวมทั้งหมด</span>
          <strong>{formatBaht(totalPrice)}</strong>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'กำลังส่งออเดอร์...' : 'ยืนยันสั่งอาหาร'}
        </button>
      </form>
    </div>
  );
}
