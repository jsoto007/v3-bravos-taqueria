import React, { Suspense, lazy } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Route guards (lazy)
const ProtactedRoutes = lazy(() => import('./utils/ProtectedRoutes'))
const AdminProtectedRoutes = lazy(() => import('./utils/AdminProtectedRoutes'))

// Layout (lazy)
const NavBarContainer = lazy(() => import('./components/NavBarContainer'))
const Footer = lazy(() => import('./shared/Footer'))

// Public pages (lazy)
const LandingPageContainer = lazy(() => import('./components/landingPage/LandingPageContainer'))
const Auth = lazy(() => import('./components/authentication/Auth'))

// Authenticated pages (lazy)
const Dashboard = lazy(() => import('./components/Dashboard'))
const UserInventoryContainer = lazy(() => import('./components/inventory/UserInventoryContainer'))
const CarContainer = lazy(() => import('./components/car/CarContainer'))
const CarScannerContainer = lazy(() => import('./components/inventory/CarScannerContainer'))
const SubscriptionDashboard = lazy(() => import('./components/subscription/SubscriptionDashboard'))

// Admin pages (lazy)
const MasterInventoryContainer = lazy(() => import('./components/admin/MasterInventoryContainer'))
const MasterInventoryForm = lazy(() => import('./components/inventory/MasterInventoryForm'))
const MasterCarContainer = lazy(() => import('./components/admin/MasterCarContainer'))
const AdminInventoryReviewContainer = lazy(() => import('./components/admin/AdminInventoryReviewContainer'))

// Test routes (lazy)


// Shared
const PageNotFound = lazy(() => import('./shared/PageNotFound'))

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '1rem', fontSize: 14, opacity: 0.7 }}>Loading…</div>}>
        <div>
          <NavBarContainer />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPageContainer />} />
            <Route path="/auth" element={<Auth />} />

            {/* Authenticated routes (group/multi-tenant protected) */}
            <Route element={<ProtactedRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<UserInventoryContainer />} />
              <Route path="/cars/:id" element={<CarContainer />} />
              <Route path="/cars/scanner" element={<CarScannerContainer />} />

              {/* Account management for signed-in users */}
              <Route path="/account/settings" element={<SubscriptionDashboard />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminProtectedRoutes />}>
              <Route path="/master_inventory" element={<MasterInventoryContainer />} />
              <Route path="/master_inventory/:id" element={<MasterCarContainer />} />
              <Route path="/master_inventory/create_master_inventory" element={<MasterInventoryForm />} />
              <Route path="/admin/user_inventory_check/:id" element={<AdminInventoryReviewContainer />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Footer />
        </div>
      </Suspense>
    </Router>
  )
}

export default App
