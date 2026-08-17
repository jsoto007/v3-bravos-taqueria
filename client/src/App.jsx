import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import Visit from './pages/Visit'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="about" element={<About />} />
        <Route path="visit" element={<Visit />} />
        {/* No 404 page: this is a brochure site, so anything else is a stale
            link from the old ordering app (/cart, /orders, /admin…). Sending
            those to the home page is friendlier than a dead end. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
