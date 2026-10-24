import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Coord } from '../types'

interface Props { value: Coord | null; onChange(c: Coord): void }
interface Hit { display_name: string; lat: string; lon: string }
const KASOA: L.LatLngTuple = [5.534, -0.417] // initial view only, never saved as the vendor's location
const pinIcon = L.divIcon({ className: '', html: '<div style="font-size:30px;line-height:30px;transform:translate(-50%,-100%)">📍</div>', iconSize: [0, 0] })

export default function MapPicker({ value, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const cb = useRef(onChange); cb.current = onChange
  const [q, setQ] = useState(''); const [hits, setHits] = useState<Hit[]>([]); const [msg, setMsg] = useState('')

  const place = (c: Coord, zoom?: number, acc?: number) => {
    const m = map.current; if (!m) return
    if (!marker.current) {
      marker.current = L.marker([c.lat, c.lng], { draggable: true, icon: pinIcon }).addTo(m)
      marker.current.on('dragend', () => { const p = marker.current!.getLatLng(); place({ lat: p.lat, lng: p.lng }) })
    } else marker.current.setLatLng([c.lat, c.lng])
    circle.current?.remove(); circle.current = null
    if (acc) circle.current = L.circle([c.lat, c.lng], { radius: acc, color: '#ea580c', weight: 1 }).addTo(m)
    if (zoom) m.setView([c.lat, c.lng], zoom)
    cb.current(c)
  }

  useEffect(() => {
    const m = L.map(el.current!).setView(value ? [value.lat, value.lng] : KASOA, value ? 17 : 13)
    map.current = m
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    m.on('click', e => place({ lat: e.latlng.lat, lng: e.latlng.lng }))
    if (value) place(value)
    const t = setTimeout(() => m.invalidateSize(), 80)
    return () => { clearTimeout(t); m.remove(); map.current = null; marker.current = null; circle.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const search = async () => {
    if (!q.trim()) return
    setMsg('Searching…'); setHits([])
    try {
      const r: Hit[] = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=gh&q=${encodeURIComponent(q)}`)).json()
      setHits(r); setMsg(r.length ? '' : 'No results. Try a nearby landmark or tap the map.')
    } catch { setMsg('Search unavailable. Tap the map to place your pin.') }
  }
  const locate = () => {
    if (!navigator.geolocation) return setMsg('Geolocation is not supported on this device.')
    setMsg('Getting your location…')
    navigator.geolocation.getCurrentPosition(
      p => { setMsg(''); place({ lat: p.coords.latitude, lng: p.coords.longitude }, 18, p.coords.accuracy) },
      e => setMsg(`Could not get your location (${e.message}). Allow access or tap the map.`),
      { enableHighAccuracy: true, timeout: 15000 })
  }

  return (
    <div>
      <div className="search">
        <input value={q} placeholder="Search street, landmark or area in Ghana" onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search() } }} />
        <button type="button" className="btn" onClick={search}>Search</button>
      </div>
      <div className="results">{hits.map(h => (
        <div key={h.lat + h.lon} onClick={() => { place({ lat: +h.lat, lng: +h.lon }, 17); setHits([]) }}>{h.display_name}</div>))}</div>
      {msg && <div className="coords">{msg}</div>}
      <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={locate}>📍 Use my current location</button>
      <div ref={el} className="map" />
      <div className="coords">{value ? `Pin: ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : 'Tap the map or drag the pin to your exact entrance.'}</div>
    </div>
  )
}
