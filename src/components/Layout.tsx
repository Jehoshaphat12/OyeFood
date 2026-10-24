import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import OrderAlert from './OrderAlert'
import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../hooks/useOrder'

const titles: Record<string, string> = { '/': 'Dashboard', '/orders': 'Orders', '/menu': 'Menu Manager', '/settings': 'Store & Location' }

export default function Layout() {
  const { vendor, logout, update } = useAuth(); const { simulate } = useOrders(); const [open, setOpen] = useState(false); const { pathname } = useLocation()
  if (!vendor) return null
  const fresh = vendor.orders.filter(o => o.status === 'New').length
  const link = (to: string, label: string, badge?: number) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => 'nav' + (isActive ? ' on' : '')} onClick={() => setOpen(false)}>
      {label}{!!badge && <span className="badge">{badge}</span>}</NavLink>)
  return (
    <div className="app">
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={open ? 'open' : ''}>
        <div className="brand"><b>🍴</b><div><h3 style={{ color: '#fff', fontSize: 17 }}>OyeFood</h3><p style={{ fontSize: 11 }}>Vendor Dashboard</p></div></div>
        {link('/', 'Dashboard')}{link('/orders', 'Orders', fresh)}{link('/menu', 'Menu Manager')}{link('/settings', 'Store & Location')}
        <div className="nav" onClick={logout}>Log out</div>
        <div className="sw"><b>Store status</b>
          <div className="r"><span style={{ color: vendor.isOpen ? '#10b981' : '#ef4444' }}>● {vendor.isOpen ? 'Open' : 'Closed'}</span>
            <input type="checkbox" checked={vendor.isOpen} style={{ width: 'auto' }} onChange={e => update({ isOpen: e.target.checked })} /></div></div>
      </aside>
      <main>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn ghost sm menu-btn" onClick={() => setOpen(!open)}>☰</button>
          <div style={{ minWidth: 0 }}><h1>{titles[pathname] ?? ''}</h1><p className="ell">{vendor.name} · {vendor.location.address || 'Location set'}</p></div></div>
          <button className="btn ghost sm" onClick={simulate} title="Create a test order">🔔{fresh > 0 && <span className="badge" style={{ marginLeft: 6 }}>{fresh}</span>}</button></header>
        <div className="page"><Outlet /></div>
      </main>
      {vendor.isOpen && <OrderAlert />}
    </div>
  )
}
