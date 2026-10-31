// ชั้นเรียก API ที่เดียว: component ไม่ต้องรู้เรื่อง fetch / header / token
import { getStoredLang, translate } from '../i18n/index.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'oms_token';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status; // 0 = ต่อ server ไม่ได้, 401 = ยังไม่ login/token หมดอายุ
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, translate(getStoredLang(), 'api.network'));
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // response ไม่มี body ที่เป็น JSON
  }

  if (!response.ok) {
    throw new ApiError(response.status, (data && data.message) || translate(getStoredLang(), 'api.generic', { status: response.status }));
  }
  return data;
}

export const api = {
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),

  getMenus: () => request('/api/menus'),
  getAllMenus: () => request('/api/menus/all', { auth: true }), // admin: รวมเมนูที่ซ่อนไว้
  createMenu: (item) => request('/api/menus', { method: 'POST', body: item, auth: true }),
  updateMenu: (id, item) => request(`/api/menus/${id}`, { method: 'PUT', body: item, auth: true }),
  deleteMenu: (id) => request(`/api/menus/${id}`, { method: 'DELETE', auth: true }), // { result: 'deleted' | 'hidden' }

  // ส่ง token ไปด้วยถ้ามี (พนักงานสั่งแทนลูกค้า -> backend จะบันทึก employee_id ให้) ถ้าไม่มีก็สั่งแบบลูกค้าทั่วไป
  createOrder: (order) => request('/api/orders', { method: 'POST', body: order, auth: true }),
  getOrderStatus: (id) => request(`/api/orders/${id}/status`),

  getOrders: () => request('/api/orders', { auth: true }),
  updateOrderStatus: (id, status) =>
    request(`/api/orders/${id}`, { method: 'PATCH', body: { status }, auth: true }),

  // รับชำระเงิน + ปิดออเดอร์ { payment_method: 'cash'|'card'|'qr', amount_received (เฉพาะ cash) }
  payOrder: (id, body) => request(`/api/orders/${id}/pay`, { method: 'POST', body, auth: true }),

  // แดชบอร์ดสำหรับ admin: สรุปยอดรายได้ ออเดอร์ เมนูขายดี สถานะโต๊ะ ฯลฯ
  // ระบบจองโต๊ะ: ลูกค้าจองได้โดยไม่ login ส่วนที่เหลือเป็นของพนักงาน (admin / waiter, ลบได้เฉพาะ admin)
  createReservation: (body) => request('/api/reservations', { method: 'POST', body }),
  getReservations: (date) => request(`/api/reservations?date=${encodeURIComponent(date)}`, { auth: true }),
  getReservationTables: () => request('/api/reservations/tables', { auth: true }),
  updateReservationStatus: (id, status) => request(`/api/reservations/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  updateReservation: (id, body) => request(`/api/reservations/${id}`, { method: 'PUT', body, auth: true }),
  deleteReservation: (id) => request(`/api/reservations/${id}`, { method: 'DELETE', auth: true }),

  // date = 'YYYY-MM-DD' (ไม่ใส่ = วันนี้) ยอดขายมาจาก stored procedure sp_sales_summary
  getDashboardStats: (date) => request(`/api/dashboard${date ? `?date=${encodeURIComponent(date)}` : ''}`, { auth: true })
};
