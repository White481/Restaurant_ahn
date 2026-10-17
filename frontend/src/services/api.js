// ชั้นเรียก API ที่เดียว: component ไม่ต้องรู้เรื่อง fetch / header / token
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
    throw new ApiError(0, 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend เปิดอยู่');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // response ไม่มี body ที่เป็น JSON
  }

  if (!response.ok) {
    throw new ApiError(response.status, (data && data.message) || `เกิดข้อผิดพลาด (${response.status})`);
  }
  return data;
}

export const api = {
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),

  getMenus: () => request('/api/menus'),
  createMenu: (item) => request('/api/menus', { method: 'POST', body: item, auth: true }),

  // ส่ง token ไปด้วยถ้ามี (พนักงานสั่งแทนลูกค้า -> backend จะบันทึก employee_id ให้) ถ้าไม่มีก็สั่งแบบลูกค้าทั่วไป
  createOrder: (order) => request('/api/orders', { method: 'POST', body: order, auth: true }),
  getOrderStatus: (id) => request(`/api/orders/${id}/status`),

  getOrders: () => request('/api/orders', { auth: true }),
  updateOrderStatus: (id, status) =>
    request(`/api/orders/${id}`, { method: 'PATCH', body: { status }, auth: true })
};
