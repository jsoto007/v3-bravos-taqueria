import React from 'react'
import './App.css'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';

function App() {
 

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/Dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
