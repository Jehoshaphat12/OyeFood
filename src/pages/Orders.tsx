import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Order, OrderStatus } from '../types'
import OrderDetails from '../components/OrderDetails'
import { money, timeAgo } from '../lib/utils'
// 1. Import ACTIVE, flow, and useOrders
import { flow, useOrders } from '../hooks/useOrder'

export function OrderCard({ o, onOpen }: { o: Order; onOpen(o: Order): void }) {
  const { advance } = useOrders(); 
  const a = flow[o.status]
  
  return (
    <div className="order click" onClick={() => onOpen(o)}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div className="avatar">{o.customer.charAt(0)}</div>
        <div>
          <b>{o.customer}</b> <span style={{ color: 'var(--g)', fontSize: 12 }}>· #{o.id.slice(-6).toUpperCase()}</span>
          <div style={{ fontSize: 13, color: 'var(--g)', margin: '3px 0 6px' }}>
            {o.items.length} item(s) · {o.items[0]?.name}
          </div>
          {/* Assuming Pay is a component that displays the payment method */}
          <span className={`payment-badge`}>{o.payment}</span> 
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'grid', gap: 6, justifyItems: 'end' }}>
        <b style={{ fontSize: 17 }}>{money(o.total)}</b>
        <span className={`st ${o.status}`}>{o.status}</span>
        <span style={{ fontSize: 12, color: 'var(--g)' }}>{timeAgo(o.createdAt)}</span>
        {a && (
          <button 
            className={'btn sm ' + (a.next === 'Delivered' ? 'ok' : '')} 
            onClick={e => { 
              e.stopPropagation(); 
              advance(o); 
            }}
          >
            {a.label}
          </button>
        )}
      </div>
    </div>
  )
}

const TABS = ['All', 'New', 'In progress', 'Completed', 'Cancelled'] as const
type TabType = typeof TABS[number]

const match = (t: TabType, o: Order) => {
  if (t === 'All') return true;
  if (t === 'New') return o.status === 'New';
  if (t === 'In progress') return ['Preparing', 'Ready', 'Dispatched'].includes(o.status);
  if (t === 'Completed') return o.status === 'Delivered';
  if (t === 'Cancelled') return o.status === 'Cancelled';
  return false;
}

export default function Orders() {
  const { vendor } = useAuth(); 
  // 2. Pull orders and simulate from the hook instead of vendor.orders
  const { orders, loadingOrders, simulate } = useOrders(); 
  
  const [tab, setTab] = useState<TabType>('All'); 
  const [q, setQ] = useState(''); 
  const [open, setOpen] = useState<string | null>(null)

  // 3. Use the live orders array
  const all = orders || []
  
  const list = all.filter(o => 
    match(tab, o) && 
    (o.customer + o.id + (o.phone || '')).toLowerCase().includes(q.toLowerCase())
  )
  
  const sel = all.find(o => o.id === open)

  if (loadingOrders) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--g)' }}>Loading orders...</div>
  }

  return (
    <>
      <div className="toolbar">
        <div className="pills">
          {TABS.map(t => (
            <button 
              key={t} 
              className={'pill' + (t === tab ? ' on' : '')} 
              onClick={() => setTab(t)}
            >
              {t} ({all.filter(o => match(t, o)).length})
            </button>
          ))}
        </div>
        <input 
          style={{ maxWidth: 240 }} 
          placeholder="Search name, phone, order #" 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
        <button className="btn ghost sm" onClick={simulate}>+ Test order</button>
      </div>

      {list.length ? (
        list.map(o => <OrderCard key={o.id} o={o} onOpen={x => setOpen(x.id)} />)
      ) : (
        <div className="empty">No orders match.</div>
      )}

      {sel && <OrderDetails order={sel} onClose={() => setOpen(null)} />}
    </>
  )
}