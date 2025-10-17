import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './admin/AdminLayout'
import OwnerLayout from './owner/OwnerLayout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import AuthLogin from './pages/AuthLogin'
import AuthSignup from './pages/AuthSignup'
import OrdersDashboard from './admin/OrdersDashboard'
import InventoryDashboard from './admin/InventoryDashboard'
import FoodCost from './admin/FoodCost'
import Reports from './owner/Reports'
import MenuManager from './owner/MenuManager'
import Settings from './owner/Settings'
import { useAuth } from './context/AuthContext'

function Protected({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center">Loading...</div>
  if (!user) return <Navigate to="/auth/login" replace />
  if (role === 'admin' && !user.admin) return <Navigate to="/" replace />
  if (role === 'owner' && !user.is_owner_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}> 
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="auth/login" element={<AuthLogin />} />
        <Route path="auth/signup" element={<AuthSignup />} />
      </Route>

      <Route path="/admin" element={<Protected role="admin"><AdminLayout /></Protected>}>
        <Route index element={<OrdersDashboard />} />
        <Route path="inventory" element={<InventoryDashboard />} />
        <Route path="food-cost" element={<FoodCost />} />
      </Route>

      <Route path="/owner" element={<Protected role="owner"><OwnerLayout /></Protected>}>
        <Route index element={<Reports />} />
        <Route path="menu" element={<MenuManager />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

