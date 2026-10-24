import type { Dish, Order, OrderItem, Vendor } from '../types'
/** All persistence lives here. Replace with Firebase Auth + Firestore (`vendors/{id}`) later. */
interface DB { vendors: Vendor[]; session: string | null }
const KEY = 'oyefood-vendor'
/** Fills fields added in newer versions so older saved accounts keep working. */
const normalize = (v: Vendor): Vendor => ({
  ...v, deliveryFee: v.deliveryFee ?? 8,
  dishes: (v.dishes ?? []).map(d => (({ category: 'Local Ghanaian', imageUrl: '', ...(d as Partial<Dish>) } as Dish))),
  orders: (v.orders ?? []).map(o => ({ phone: '', address: '', deliveryFee: 0, payment: 'MoMo', createdAt: Date.now(), seen: true, ...(o as Partial<Order>),
    items: o.items.map(i => ({ price: 0, addons: [], ...(i as Partial<OrderItem>) })) } as Order)),
})
const read = (): DB => { try { const d = { vendors: [], session: null, ...JSON.parse(localStorage.getItem(KEY) || '{}') } as DB; d.vendors = d.vendors.map(normalize); return d } catch { return { vendors: [], session: null } } }
const write = (d: DB) => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* storage unavailable */ } }
export const Store = {
  vendors: (): Vendor[] => read().vendors,
  saveVendor(v: Vendor) { const d = read(); d.vendors = d.vendors.filter(x => x.id !== v.id).concat(v); write(d) },
  session: (): string | null => read().session,
  setSession(id: string | null) { const d = read(); d.session = id; write(d) },
}
