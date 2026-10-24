import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapPicker from '../components/MapPicker'
import { normPhone, validCoord } from '../lib/utils'
import type { Coord } from '../types'
import { useAuth } from '../contexts/AuthContext'

const Brand = () => <div className="brand"><b>🍴</b><div><h2>OyeFood Vendor</h2><p style={{ fontSize: 12, color: 'var(--g)' }}>Sell to customers around you</p></div></div>

export function Login() {
  const { login } = useAuth(); const nav = useNavigate()
  const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    const r = await login(id, pw); setBusy(false)
    if (r) setErr(r); else nav('/')
  }
  return (
    <div className="auth"><form className="auth-box" onSubmit={submit}>
      <Brand />
      <label>Email or phone</label><input value={id} onChange={e => setId(e.target.value)} required />
      <label>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} required />
      <div className="err">{err}</div>
      <div className="acts"><button className="btn" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button></div>
      <p className="alt">New vendor? <Link to="/register">Create an account</Link></p>
    </form></div>
  )
}

export function Register() {
  const { register } = useAuth(); const nav = useNavigate()
  const [step, setStep] = useState(1); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ owner: '', email: '', phone: '', pw: '', pw2: '', name: '', desc: '', category: 'Local Ghanaian', open: '07:00', close: '21:00', address: '' })
  const [pin, setPin] = useState<Coord | null>(null)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const next = async () => {
    if (step === 1) {
      if (f.owner.trim().length < 2) return setErr('Enter your full name.')
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email.')
      if (normPhone(f.phone).length !== 10) return setErr('Enter a valid 10-digit Ghana phone number.')
      if (f.pw.length < 6) return setErr('Password must be at least 6 characters.')
      if (f.pw !== f.pw2) return setErr('Passwords do not match.')
    } else if (step === 2) {
      if (!f.name.trim()) return setErr('Enter your restaurant name.')
    } else {
      if (!validCoord(pin)) return setErr('Set your restaurant location on the map (inside Ghana).')
      setBusy(true)
      const r = await register({ owner: f.owner, email: f.email, phone: f.phone, password: f.pw, name: f.name, desc: f.desc, category: f.category, open: f.open, close: f.close, location: { ...pin, address: f.address.trim() } })
      setBusy(false)
      if (r) { setErr(r); setStep(1); return }
      return nav('/')
    }
    setErr(''); setStep(step + 1)
  }

  return (
    <div className="auth"><div className="auth-box">
      <Brand />
      <div className="steps">{[1, 2, 3].map(n => <i key={n} className={n <= step ? 'on' : ''} />)}</div>
      {step === 1 && <>
        <label>Your full name</label><input value={f.owner} onChange={set('owner')} />
        <div className="row"><div><label>Email</label><input type="email" value={f.email} onChange={set('email')} /></div>
          <div><label>Phone (MoMo/WhatsApp)</label><input value={f.phone} placeholder="024 123 4567" onChange={set('phone')} /></div></div>
        <div className="row"><div><label>Password</label><input type="password" value={f.pw} onChange={set('pw')} /></div>
          <div><label>Confirm password</label><input type="password" value={f.pw2} onChange={set('pw2')} /></div></div></>}
      {step === 2 && <>
        <label>Restaurant name</label><input value={f.name} onChange={set('name')} />
        <label>Description</label><textarea rows={2} value={f.desc} onChange={set('desc')} placeholder="Authentic Ghanaian cuisine…" />
        <div className="row"><div><label>Opens</label><input type="time" value={f.open} onChange={set('open')} /></div>
          <div><label>Closes</label><input type="time" value={f.close} onChange={set('close')} /></div></div>
        <label>Category</label>
        <select value={f.category} onChange={set('category')}>{['Local Ghanaian', 'Fast Food', 'Drinks & Snacks', 'Bakery'].map(c => <option key={c}>{c}</option>)}</select></>}
      {step === 3 && <>
        <label>Where is your restaurant?</label>
        <MapPicker value={pin} onChange={setPin} />
        <label>Address / landmark note for riders</label>
        <input value={f.address} onChange={set('address')} placeholder="e.g. Opposite Kasoa Total filling station" /></>}
      <div className="err">{err}</div>
      <div className="acts">
        {step > 1 && <button className="btn ghost" onClick={() => { setErr(''); setStep(step - 1) }}>Back</button>}
        <button className="btn" disabled={busy} onClick={next}>{step === 3 ? (busy ? 'Creating…' : 'Create account') : 'Next'}</button>
      </div>
      <p className="alt">Already registered? <Link to="/login">Log in</Link></p>
    </div></div>
  )
}
