import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import ProtactedRoutes from './utils/ProtectedRoutes';
import Auth from './components/authentication/Auth'
import CarsContainer from './components/cars/CarsContainer';
import ClientsContainer from './components/ClientsContainer';
import UserInventoryContainer from './components/inventory/UserInventoryContainer';
import MasterInventoryContainer from './components/admin/MasterInventoryContainer';
import MasterInventoryForm from './components/inventory/MasterInventoryForm';
import MasterCarContainer from './components/admin/MasterCarContainer';
import AdminInventoryReviewContainer from './components/admin/AdminInventoryReviewContainer';
import AdminProtectedRoutes from './utils/AdminProtectedRoutes';
import LandingPageContainer from './components/landingPage/LandingPageContainer';
import NavBarContainer from './components/NavBarContainer';


function App() {

  
  return (
    <Router>
      <div>
        <NavBarContainer />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<LandingPageContainer />} />
          <Route element={<ProtactedRoutes />}>
            <Route path="/home" element={<CarsContainer />} />
            <Route path="/inventory" element={<UserInventoryContainer />} />
            <Route path="/client_outreach" element={<ClientsContainer />} />

            <Route path="/master_inventory/:id" element={<MasterCarContainer />} />
            <Route path="/master_inventory/create_master_inventory" element={<MasterInventoryForm />} />
            <Route path="/admin/user_inventory_check/:id" element={<AdminInventoryReviewContainer />} />
          
            <Route path="/master_inventory" element={<MasterInventoryContainer />} />
          </Route>

          <Route element={<AdminProtectedRoutes />}>
          </Route>
          
        </Routes>
      </div>
    </Router>
  )
}

export default App
