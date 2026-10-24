import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import Layout from './components/Layout'
import { Login, Register } from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Menu from './pages/Menu'
import Settings from './pages/Settings'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const Private = ({ children }: { children: ReactElement }) => useAuth().vendor ? children : <Navigate to="/login" replace />
const Public = ({ children }: { children: ReactElement }) => useAuth().vendor ? <Navigate to="/" replace /> : children

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Public><Login /></Public>} />
    <Route path="/register" element={<Public><Register /></Public>} />
    <Route element={<Private><Layout /></Private>}>
      <Route index element={<Dashboard />} /><Route path="orders" element={<Orders />} />
      <Route path="menu" element={<Menu />} /><Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></AuthProvider>
}
