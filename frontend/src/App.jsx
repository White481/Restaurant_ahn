import { Link, Route, Routes } from 'react-router-dom';
import { buttonClasses } from './ui/Button.jsx';
import MenuPage from './customer/MenuPage.jsx';
import CartPage from './customer/CartPage.jsx';
import OrderStatusPage from './customer/OrderStatusPage.jsx';
import LoginPage from './staff/LoginPage.jsx';
import OrdersPage from './staff/OrdersPage.jsx';
import MenuAdminPage from './staff/MenuAdminPage.jsx';
import DashboardPage from './staff/DashboardPage.jsx';
import RequireAuth from './staff/RequireAuth.jsx';
import { useLang } from './i18n/LanguageContext.jsx';

function NotFound() {
  const { t } = useLang();
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 text-center text-stone-950">
      <div>
        <p className="font-display text-8xl font-extrabold italic text-brand-600">404</p>
        <div className="rule-diamond mx-auto my-5 w-40" />
        <h1 className="mb-6 font-display text-2xl font-bold">{t('notFound.title')}</h1>
        <Link className={buttonClasses('primary', 'md')} to="/">
          {t('notFound.home')}
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
      <Route
        path="/staff/dashboard"
        element={
          <RequireAuth roles={['admin']}>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
