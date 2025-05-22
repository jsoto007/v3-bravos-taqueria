import React, { useContext } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import { UserContext } from './context/UserContextProvider';
import ProtactedRoutes from './utils/ProtectedRoutes';
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import NavBar from './components/NavBar';
import CarsContainer from './components/CarsContainer';
import ClientsContainer from './components/ClientsContainer';
import UserInventoryContainer from './components/UserInventoryContainer';
import MasterInventoryContainer from './components/MasterInventoryContainer';
import MasterInventoryForm from './components/MasterInventoryForm';
import MasterCarContainer from './components/MasterCarContainer';
import AdminInventoryReviewContainer from './components/AdminInventoryReviewContainer';
import AdminProtectedRoutes from './utils/AdminProtectedRoutes';


function App() {
  const { currentUser } = useContext(UserContext)
 

  return (
    <Router>
      <div>
        {currentUser? <NavBar /> : null}
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtactedRoutes />}>
            <Route path="/" element={<CarsContainer />} />
            <Route path="/inventory" element={<UserInventoryContainer />} />
            <Route path="/client_outreach" element={<ClientsContainer />} />

            <Route path="/master_inventory/:id" element={<MasterCarContainer />} />
            <Route path="/master_inventory/create_master_inventory" element={<MasterInventoryForm />} />
            <Route path="/admin/user_inventory_check/:id" element={<AdminInventoryReviewContainer />} />
          </Route>
          
          <Route element={<AdminProtectedRoutes />}>
            <Route path="/master_inventory" element={<MasterInventoryContainer />} />
          </Route>
          
        </Routes>
      </div>
    </Router>
  )
}

export default App
