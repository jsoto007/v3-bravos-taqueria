import React, { useContext } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import { UserContext } from './context/UserContextProvider';
import ProtactedRoutes from './utils/ProtectedRoutes';
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import NavBar from './components/NavBar';
import CarsContainer from './components/CarsContainer';
import InventoryForm from './components/InventoryForm';
import ClientsContainer from './components/ClientsContainer';


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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crete_inventory" element={<InventoryForm />} />
            <Route path="/client_outreach" element={<ClientsContainer />} />
          </Route>
          
        </Routes>
      </div>
    </Router>
  )
}

export default App
