import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import MapPicker from '../components/MapPicker'
import { normPhone, validCoord } from '../lib/utils'
import type { Coord } from '../types'

export default function Settings() {
  const { vendor: v, update } = useAuth()
  const [f, setF] = useState(() => ({ name: v!.name, desc: v!.desc, phone: v!.phone, prep: String(v!.prep), open: v!.open, close: v!.close, min: String(v!.minOrder), fee: String(v!.deliveryFee), address: v!.location.address }))
  const [pin, setPin] = useState<Coord | null>({ lat: v!.location.lat, lng: v!.location.lng }); const [msg, setMsg] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!validCoord(pin)) return setMsg('Set a valid restaurant location in Ghana.')
    update({ name: f.name.trim() || v!.name, desc: f.desc.trim(), phone: normPhone(f.phone) || v!.phone, prep: +f.prep || 20, open: f.open, close: f.close, minOrder: +f.min || 0, deliveryFee: Math.max(0, +f.fee || 0), location: { ...pin, address: f.address.trim() } })
    setMsg('✓ Saved'); setTimeout(() => setMsg(''), 2500)
  }
  return <>
    <div className="card"><h3>Store information</h3>
      <label>Restaurant name</label><input value={f.name} onChange={set('name')} />
      <label>Description</label><textarea rows={2} value={f.desc} onChange={set('desc')} />
      <div className="row"><div><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div><div><label>Prep time (min)</label><input type="number" value={f.prep} onChange={set('prep')} /></div></div>
      <div className="row"><div><label>Opens</label><input type="time" value={f.open} onChange={set('open')} /></div><div><label>Closes</label><input type="time" value={f.close} onChange={set('close')} /></div></div>
      <div className="row"><div><label>Minimum order (GH₵)</label><input type="number" value={f.min} onChange={set('min')} /></div><div><label>Delivery fee (GH₵)</label><input type="number" step="0.5" value={f.fee} onChange={set('fee')} /></div></div></div>
    <div className="card"><h3>Restaurant location</h3>
      <p style={{ fontSize: 13, color: 'var(--g)', margin: '4px 0 12px' }}>Riders and customers use this pin. Drag it to your exact entrance.</p>
      <MapPicker value={pin} onChange={setPin} />
      <label>Address / landmark note</label><input value={f.address} onChange={set('address')} /></div>
    <button className="btn" onClick={save}>Save changes</button> <span style={{ fontSize: 13, color: msg.startsWith('✓') ? 'var(--ok)' : 'var(--bad)' }}>{msg}</span>
  </>
}
