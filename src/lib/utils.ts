import type { Coord } from '../types'
export const normPhone = (p: string): string => {
  let d = p.replace(/\D/g, ''); if (d.startsWith('233')) d = '0' + d.slice(3); return d
}
export const hash = async (s: string): Promise<string> => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}
/** Rejects NaN, (0,0) and anything outside Ghana's bounding box. */
export const validCoord = (c: Coord | null): c is Coord =>
  !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && !(c.lat === 0 && c.lng === 0) &&
  c.lat >= 4 && c.lat <= 11.5 && c.lng >= -3.5 && c.lng <= 1.5
export const uid = (p: string) => `${p}_${Date.now()}${Math.floor(Math.random() * 1000)}`
export const timeAgo = (t: number): string => {
  const m = Math.floor((Date.now() - t) / 60000)
  return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} hr ago` : `${Math.floor(m / 1440)} d ago`
}
export const isToday = (t: number) => new Date(t).toDateString() === new Date().toDateString()
export const money = (n: number) => `GH₵ ${n.toFixed(2)}`
