import { Link, Route, Routes } from 'react-router-dom';
import { buttonClasses } from './ui/Button.jsx';
import MenuPage from './customer/MenuPage.jsx';
import CartPage from './customer/CartPage.jsx';
import OrderStatusPage from './customer/OrderStatusPage.jsx';
import LoginPage from './staff/LoginPage.jsx';
import OrdersPage from './staff/OrdersPage.jsx';
import MenuAdminPage from './staff/MenuAdminPage.jsx';
import RequireAuth from './staff/RequireAuth.jsx';

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 px-4 text-center text-stone-900">
      <div>
        <h1 className="mb-4 text-2xl font-bold">ไม่พบหน้านี้</h1>
        <Link className={buttonClasses('primary', 'md')} to="/">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ฝั่งลูกค้า: ไม่ต้อง login */}
      <Route path="/" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/order/:id" element={<OrderStatusPage />} />

      {/* ฝั่งพนักงาน */}
      <Route path="/staff/login" element={<LoginPage />} />
      <Route
        path="/staff"
        element={
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/staff/menu"
        element={
          <RequireAuth roles={['admin']}>
            <MenuAdminPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
