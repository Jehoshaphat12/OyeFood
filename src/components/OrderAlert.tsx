import { useOrders } from '../hooks/useOrder';
import { money } from '../lib/utils'
import { Pay } from './OrderDetails'

/** Pops up for the newest unseen New order coming from the live Firestore stream. */
export default function OrderAlert() {
  // 1. Pull live orders from the hook instead of vendor.orders
  const { orders, advance, dismiss, reject } = useOrders()
  
  // 2. Find the first (newest) order that is New and hasn't been seen by the vendor
  const o = orders.find(x => x.status === 'New' && !x.seen)
  
  if (!o) return null
  
  return (
    <div className="modal">
      <div className="sheet" style={{ borderTop: '4px solid var(--p)' }}>
        <h3 style={{ color: 'var(--p)' }}>
          <span className="pulse" /> New order received!
        </h3>
        
        <div className="box" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <b style={{ color: 'var(--pd)' }}>#{o.id.slice(-6).toUpperCase()}</b>
            <span className="st New">New</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--g)', margin: '6px 0' }}>
            {o.customer} · {o.phone}
          </p>
          <Pay p={o.payment} />
        </div>
        
        {o.items.map((i, k) => (
          <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{i.qty}× {i.name}</span>
              <b>{money(i.price * i.qty)}</b>
            </div>
            {i.addons.length > 0 && <span className="addons">{i.addons.join(', ')}</span>}
          </div>
        ))}
        
        {o.note && <div className="note">📝 {o.note}</div>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
          <b>Total</b>
          <b style={{ fontSize: 22, color: 'var(--p)' }}>{money(o.total)}</b>
        </div>
        
        <div className="acts">
          <button className="btn ghost" onClick={() => reject(o)}>Reject</button>
          <button className="btn ghost" onClick={() => dismiss(o)}>Later</button>
          <button className="btn" style={{ flex: 2 }} onClick={() => advance(o)}>Accept order</button>
        </div>
      </div>
    </div>
  )
}