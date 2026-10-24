import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { OrderCard } from './Orders'
import OrderDetails from '../components/OrderDetails'
import { isToday, money } from '../lib/utils'
import { useOrders, ACTIVE, flow } from '../hooks/useOrder'

const STEPS = ['New', 'Preparing', 'Ready', 'Dispatched']

export default function Dashboard() {
  const { vendor: v } = useAuth(); 
  const { orders, advance, loadingOrders, simulate } = useOrders(); 
  const [open, setOpen] = useState<string | null>(null)

  if (!v) return null
  
  if (loadingOrders) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--g)' }}>Loading live orders...</div>
  }

  const active = orders.find(o => ACTIVE.includes(o.status))
  
  const today = orders.filter(o => isToday(o.createdAt) && o.status !== 'Cancelled')
  const delivered = today.filter(o => o.status === 'Delivered')
  const revenue = delivered.reduce((s, o) => s + o.total, 0)
  
  const stats: [string, string, string][] = [
    ['Today’s orders', String(today.length), 'orange'], 
    ['Today’s revenue', money(revenue), 'green'],
    ['Avg. order value', today.length ? money(today.reduce((s, o) => s + o.total, 0) / today.length) : '—', 'blue'], 
    ['Dishes available', `${v.dishes?.filter(d => d.available).length || 0}/${v.dishes?.length || 0}`, 'yellow']
  ]
  
  const a = active && flow[active.status]
  const idx = active ? STEPS.indexOf(active.status) : 0
  
  return (
    <>
      {active ? (
        <div className="active-card">
          <div className="active-head">
            <div>
              <h3>Order #{active.id.slice(-6).toUpperCase()}</h3>
              <p>{active.customer} · {active.phone}</p>
            </div>
            <b style={{ fontSize: 20 }}>{money(active.total)}</b>
          </div>
          <div className="active-body">
            <div style={{ flex: 1 }}>
              <div className="progress">
                {STEPS.map((_, i) => <i key={i} className={i <= idx ? 'done' : ''} />)}
              </div>
              
              <small style={{ color: 'var(--g)', fontWeight: 700 }}>ITEMS TO PREPARE</small>
              {active.items.map((i, k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bd)', fontWeight: 600 }}>
                  <span>{i.qty}× {i.name}</span>
                  {/* FIX: Map over the addons to extract the name before joining */}
                  <span style={{ fontSize: 13, color: 'var(--p)' }}>
                    {i.addons && i.addons.length > 0 
                      ? i.addons.map((addon: any) => addon.name).join(', ') 
                      : 'No add-ons'}
                  </span>
                </div>
              ))}
              {active.note && <div className="note">📝 <b>Note:</b> {active.note}</div>}
            </div>
            
            <div style={{ display: 'grid', gap: 10, alignContent: 'center', minWidth: 190 }}>
              {a && (
                <button className={'btn lg ' + (a.next === 'Delivered' ? 'ok' : '')} onClick={() => advance(active)}>
                  {a.label}
                </button>
              )}
              <button className="btn ghost sm" onClick={() => setOpen(active.id)}>View full details</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card empty">
          <div style={{ fontSize: 40 }}>☕</div>
          <h3 style={{ color: 'var(--text)' }}>No active orders right now</h3>
          <p>Accepted orders appear here for you to manage.</p>
        </div>
      )}
      
      <div className="stats">
        {stats.map(([l, n, c]) => (
          <div className="stat" key={l}>
            <span className={'dot ' + c} />
            <small>{l}</small>
            <div>{n}</div>
          </div>
        ))}
      </div>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
          <h3>Recent orders</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn ghost sm" onClick={simulate}>+ Test Order</button>
            <Link to="/orders" className="btn ghost sm" style={{ textDecoration: 'none' }}>View all →</Link>
          </div>
        </div>
        
        {orders.length ? (
          orders.slice(0, 3).map(o => <OrderCard key={o.id} o={o} onOpen={x => setOpen(x.id)} />)
        ) : (
          <div className="empty">No orders yet. Click "+ Test Order" to simulate one.</div>
        )}
      </div>
      
      {open && orders.find(o => o.id === open) && (
        <OrderDetails order={orders.find(o => o.id === open)!} onClose={() => setOpen(null)} />
      )}
    </>
  )
}