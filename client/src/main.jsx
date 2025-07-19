import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserContextProvider } from './context/UserContextProvider'
import { CarDataContextProvider } from './context/CarDataContextProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserContextProvider>
      <CarDataContextProvider>
        <App />
      </CarDataContextProvider>
    </UserContextProvider>
  </StrictMode>,
)
