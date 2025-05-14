import React, { useContext } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import ProtactedRoutes from './utils/ProtectedRoutes';
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import NavBar from './components/NavBar';
import { UserContext } from './context/UserContextProvider';


function App() {
  const { currentUser } = useContext(UserContext)
 

  return (
    <Router>
      <div>
        {/* <NavBar /> */}
        {currentUser? <NavBar /> : null}
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route element={<ProtactedRoutes />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
          
        </Routes>
      </div>
    </Router>
  )
}

export default App
