import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewEvaluation from './pages/NewEvaluation'
import BiasFairness from './pages/BiasFairness'
import Report from './pages/Report'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/evaluation" element={<NewEvaluation />} />
        <Route path="/bias" element={<BiasFairness />} />
        <Route path="/report" element={<Report />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
