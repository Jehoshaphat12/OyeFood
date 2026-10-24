import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES, type Addon, type Dish, type AddonType } from '../types'
import { money, uid } from '../lib/utils'

interface Draft {
  name: string; description: string; price: string; category: string; imageUrl: string; popular: boolean;
  addons: { 
    name: string; 
    type: AddonType; 
    price: string; 
    minPrice: string; 
    options: { name: string; price: string }[] 
  }[] 
}

const toDraft = (d?: Dish): Draft => ({
  name: d?.name ?? '', description: d?.description ?? '', price: d ? String(d.price) : '', 
  category: d?.category ?? CATEGORIES[0], imageUrl: d?.imageUrl ?? '', popular: d?.popular ?? false,
  addons: d?.addons?.length ? d.addons.map(a => ({
    name: a.name,
    type: a.type || 'fixed',
    price: a.price ? String(a.price) : '',
    minPrice: a.minPrice ? String(a.minPrice) : '',
    options: a.options?.length ? a.options.map(o => ({ name: o.name, price: String(o.price) })) : []
  })) : []
})


function DishModal({ dish, onClose }: { dish?: Dish; onClose(): void }) {
  const { vendor, update } = useAuth(); 
  const [d, setD] = useState<Draft>(toDraft(dish)); 
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  // FIX 1: Expanded setAddon to handle 'type' and 'minPrice'
  const setAddon = (i: number, k: 'name' | 'type' | 'price' | 'minPrice', val: string) => 
    setD({ ...d, addons: d.addons.map((a, j) => j === i ? { ...a, [k]: val } : a) })

  // FIX 2: Added the missing Option helper functions
  const setAddonOption = (addonIndex: number, optionIndex: number, k: 'name' | 'price', val: string) => {
    setD({
      ...d,
      addons: d.addons.map((a, i) => {
        if (i !== addonIndex) return a;
        return {
          ...a,
          options: a.options.map((opt, j) => j === optionIndex ? { ...opt, [k]: val } : opt)
        };
      })
    });
  };

  const addAddonOption = (addonIndex: number) => {
    setD({
      ...d,
      addons: d.addons.map((a, i) => {
        if (i !== addonIndex) return a;
        return { ...a, options: [...a.options, { name: '', price: '' }] };
      })
    });
  };

  const removeAddonOption = (addonIndex: number, optionIndex: number) => {
    setD({
      ...d,
      addons: d.addons.map((a, i) => {
        if (i !== addonIndex) return a;
        return { ...a, options: a.options.filter((_, j) => j !== optionIndex) };
      })
    });
  };
  
  const save = async () => {
    const price = parseFloat(d.price)
    if (!d.name.trim() || isNaN(price) || price < 0) return setErr('Enter a name and a valid price.')
    if (d.imageUrl && !/^https?:\/\//.test(d.imageUrl)) return setErr('Image URL must start with http:// or https://')
    
    // FIX 3: Correctly map all add-on types before saving to Firestore
    const formattedAddons: Addon[] = d.addons
      .filter(a => a.name.trim())
      .map(a => {
        const base = { name: a.name.trim(), type: a.type };
        if (a.type === 'fixed') return { ...base, price: parseFloat(a.price) || 0 };
        if (a.type === 'flexible') return { ...base, minPrice: parseFloat(a.minPrice) || 0 };
        if (a.type === 'options') {
          return {
            ...base,
            options: a.options
              .filter(o => o.name.trim())
              .map(o => ({ name: o.name.trim(), price: parseFloat(o.price) || 0 }))
          };
        }
        return base as Addon;
      });

    const data = { 
      name: d.name.trim(), 
      description: d.description.trim(), 
      price, 
      category: d.category, 
      imageUrl: d.imageUrl.trim(), 
      popular: d.popular, 
      addons: formattedAddons 
    }
    
    if (!vendor) return
    
    setSaving(true)
    setErr('')
    
    try {
      const newDishes = dish 
        ? vendor.dishes.map(x => x.id === dish.id ? { ...x, ...data } : x) 
        : [...vendor.dishes, { id: uid('d'), available: true, ...data }]
      
      await update({ dishes: newDishes })
      onClose()
    } catch (error: any) {
      console.error(error)
      setErr('Failed to save dish. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}><div className="sheet">
      <h3>{dish ? 'Edit' : 'Add'} dish</h3>
      <label>Name</label><input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="e.g. Waakye Special" />
      <label>Description</label><textarea rows={2} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} />
      <div className="row">
        <div><label>Base price (GH₵)</label><input type="number" step="0.01" value={d.price} onChange={e => setD({ ...d, price: e.target.value })} /></div>
        <div><label>Category</label><select value={d.category} onChange={e => setD({ ...d, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <label>Image URL (optional)</label><input value={d.imageUrl} onChange={e => setD({ ...d, imageUrl: e.target.value })} placeholder="https://…" />
      
      <label>Add-ons / customisation options</label>
      {d.addons.map((a, i) => (
        <div className="addon-group" key={i} style={{ border: '1px solid var(--bd)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="Add-on name (e.g. Fish)" value={a.name} onChange={e => setAddon(i, 'name', e.target.value)} style={{ flex: 1 }} />
            <select 
              value={a.type} 
              onChange={e => setAddon(i, 'type', e.target.value)}
              style={{ width: 140 }}
            >
              <option value="fixed">Fixed Price</option>
              <option value="flexible">Flexible Price</option>
              <option value="options">Has Options</option>
            </select>
            <button className="btn ghost sm" onClick={() => setD({ ...d, addons: d.addons.filter((_, j) => j !== i) })}>✕</button>
          </div>

          {/* Render inputs based on selected type */}
          {a.type === 'fixed' && (
            <input type="number" placeholder="Price (GH₵)" value={a.price} onChange={e => setAddon(i, 'price', e.target.value)} />
          )}

          {a.type === 'flexible' && (
            <input type="number" placeholder="Minimum Price (GH₵)" value={a.minPrice} onChange={e => setAddon(i, 'minPrice', e.target.value)} />
          )}

          {a.type === 'options' && (
            <div style={{ paddingLeft: 16 }}>
              <small style={{ color: 'var(--g)' }}>Options:</small>
              {a.options.map((opt, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input placeholder="Option name (e.g. Small)" value={opt.name} onChange={e => setAddonOption(i, j, 'name', e.target.value)} style={{ flex: 1 }} />
                  <input type="number" placeholder="Price" value={opt.price} onChange={e => setAddonOption(i, j, 'price', e.target.value)} />
                  <button className="btn ghost sm" onClick={() => removeAddonOption(i, j)}>✕</button>
                </div>
              ))}
              <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => addAddonOption(i)}>+ Add Option</button>
            </div>
          )}
        </div>
      ))}
      
      <button className="btn ghost sm" onClick={() => setD({ ...d, addons: [...d.addons, { name: '', type: 'fixed', price: '', minPrice: '', options: [] }] })}>
        + Add another add-on
      </button>
      
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={d.popular} onChange={e => setD({ ...d, popular: e.target.checked })} /> Mark as popular 🔥
      </label>
      
      {err && <div className="err">{err}</div>}
      <div className="acts">
        <button className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save dish'}</button>
      </div>
    </div></div>)
}

export default function Menu() {
  const { vendor, update } = useAuth(); 
  const [modal, setModal] = useState<{ dish?: Dish } | null>(null); 
  const [q, setQ] = useState(''); 
  const [cat, setCat] = useState('All')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  if (!vendor) return null

  const toggle = async (id: string) => {
    setTogglingId(id)
    try {
      await update({ dishes: vendor.dishes.map(d => d.id === id ? { ...d, available: !d.available } : d) })
    } catch (e) {
      alert('Failed to toggle availability. Please try again.')
    } finally {
      setTogglingId(null)
    }
  }

  const del = async (d: Dish) => { 
    if (confirm(`Delete "${d.name}"?`)) {
      try {
        await update({ dishes: vendor.dishes.filter(x => x.id !== d.id) })
      } catch (e) {
        alert('Failed to delete dish.')
      }
    } 
  }

  const list = vendor.dishes.filter(d => (cat === 'All' || d.category === cat) && d.name.toLowerCase().includes(q.toLowerCase()))
  const avail = vendor.dishes.filter(d => d.available).length

  return (
    <>
      <div className="toolbar">
        <div>
          <h3>Your menu</h3>
          <small style={{ color: 'var(--g)' }}>{vendor.dishes.length} {vendor.dishes.length === 1 ? 'dish' : 'dishes'} · {avail} available, {vendor.dishes.length - avail} unavailable</small>
        </div>
        <input style={{ maxWidth: 200, marginLeft: 'auto' }} placeholder="Search dishes" value={q} onChange={e => setQ(e.target.value)} />
        <select style={{ maxWidth: 170 }} value={cat} onChange={e => setCat(e.target.value)}>
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="btn" onClick={() => setModal({})}>+ Add new dish</button>
      </div>
      <div className="grid">
        {list.map(d => (
          <div key={d.id} className="dish">
            <div className="img" style={d.imageUrl ? { backgroundImage: `url("${d.imageUrl}")` } : undefined}>
              {!d.imageUrl && '🍽️'}
              {d.popular && <span className="tag">🔥 Popular</span>}
              {!d.available && <div className="off">Unavailable</div>}
            </div>
            <div style={{ padding: 16 }}>
              <b>{d.name}</b>
              <p style={{ fontSize: 13, color: 'var(--g)', margin: '6px 0', minHeight: 36 }}>{d.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0 12px' }}>
                <b style={{ fontSize: 18 }}>{money(d.price)}</b>
                <small style={{ color: 'var(--g)' }}>{d.category}{d.addons?.length ? ` · ${d.addons.length} add-ons` : ''}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost sm" onClick={() => setModal({ dish: d })}>Edit</button>
                <button 
                  className={'btn sm ' + (d.available ? 'ghost' : 'ok')} 
                  onClick={() => toggle(d.id)}
                  disabled={togglingId === d.id}
                >
                  {togglingId === d.id ? '...' : (d.available ? 'Mark unavailable' : 'Mark available')}
                </button>
                <button className="btn ghost sm" style={{ color: 'var(--bad)' }} onClick={() => del(d)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="empty" style={{ gridColumn: '1/-1' }}>{vendor.dishes.length ? 'No dishes match.' : 'Your menu is empty. Add your first dish.'}</div>}
      </div>
      {modal && <DishModal dish={modal.dish} onClose={() => setModal(null)} />}
    </>
  )
}