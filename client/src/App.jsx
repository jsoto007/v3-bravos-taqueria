import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import ProtactedRoutes from './utils/ProtectedRoutes';
import Auth from './components/authentication/Auth'
import UserInventoryContainer from './components/inventory/UserInventoryContainer';
import MasterInventoryContainer from './components/admin/MasterInventoryContainer';
import MasterInventoryForm from './components/inventory/MasterInventoryForm';
import MasterCarContainer from './components/admin/MasterCarContainer';
import AdminInventoryReviewContainer from './components/admin/AdminInventoryReviewContainer';
import AdminProtectedRoutes from './utils/AdminProtectedRoutes';
import LandingPageContainer from './components/landingPage/LandingPageContainer';
import NavBarContainer from './components/NavBarContainer';
import Dashboard from './components/Dashboard';
import Footer from './shared/Footer';
import PageNotFound from './shared/PageNotFound';

import SubscriptionDashboard from './components/subscription/SubscriptionDashboard';

import InventoryFeed from './components/inventory/InventoryFeed';
// Testing routes:
import CarVinScanHistoryCard from './components/inventory/CarVinScanHistoryCard';
import ScanbotVinText from './utils/ScanbotVinText';
import CarNotes from './components/carNotes/CarNotes';
import CarContainer from './components/car/CarContainer';

function App() {

  
  return (
    <Router>
      <div>
        <NavBarContainer />
        <Routes>
          <Route path="/" element={<LandingPageContainer />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtactedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<UserInventoryContainer />} />

{/* TEST routes++++++++++++ */}
            <Route path="/test_scanner" element={<ScanbotVinText />} />
            <Route path="/test_inventory" element={<CarVinScanHistoryCard />} />
            <Route path="/test_notes" element={<CarNotes />} />
            <Route path="/test_cars" element={<CarContainer />} />

{/* End of test routes+++++ */}

            <Route path="/subscriptions" element={<SubscriptionDashboard />} />
            <Route path="/master_inventory/:id" element={<MasterCarContainer />} />
            <Route path="/master_inventory/create_master_inventory" element={<MasterInventoryForm />} />
            <Route path="/admin/user_inventory_check/:id" element={<AdminInventoryReviewContainer />} />
          
          </Route>
            <Route path="/master_inventory" element={<MasterInventoryContainer />} />

          <Route element={<AdminProtectedRoutes />}>

          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
