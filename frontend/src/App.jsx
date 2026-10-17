import { Link, Route, Routes } from 'react-router-dom';
import MenuPage from './customer/MenuPage.jsx';
import CartPage from './customer/CartPage.jsx';
import OrderStatusPage from './customer/OrderStatusPage.jsx';
import LoginPage from './staff/LoginPage.jsx';
import DashboardPage from './staff/DashboardPage.jsx';
import RequireAuth from './staff/RequireAuth.jsx';

function NotFound() {
  return (
    <div className="page narrow">
      <h1>ไม่พบหน้านี้</h1>
      <Link className="btn btn-primary" to="/">
        กลับหน้าแรก
      </Link>
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
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
