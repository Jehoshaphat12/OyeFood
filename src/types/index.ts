export interface Coord {
  lat: number;
  lng: number;
}
export interface VendorLocation extends Coord {
  address: string;
}

export type AddonType = 'fixed' | 'flexible' | 'options';

export interface AddonOption {
  name: string;
  price: number;
}

export interface Addon {
  id?: string;        // Useful for tracking
  name: string;       // e.g., "Gari", "Fried Fish"
  type: AddonType;    
  
  price?: number;     // Used if type === 'fixed'
  minPrice?: number;  // Used if type === 'flexible'
  maxPrice?: number;  // Optional limit for 'flexible'
  options?: AddonOption[]; // Used if type === 'options'
}
export const CATEGORIES = [
  "Local Ghanaian",
  "Fast Food",
  "Drinks & Snacks",
  "Bakery",
] as const;
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  popular: boolean;
  available: boolean;
  addons: Addon[];
}
export type OrderStatus =
  | "New"
  | "Preparing"
  | "Ready"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";
export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  totalPrice: number;
  addons: OrderAddon[];
}

export interface OrderAddon {
  name: string;
  price: number;
}

export interface OrderLocation {
  latitude: number;
  longitude: number;
  address: string;
}
export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  payment: "MoMo" | "Cash";
  status: OrderStatus;
  note?: string;
  createdAt: number;
  seen?: boolean;
}
export interface Vendor {
  id: string;
  owner: string;
  email: string;
  phone: string;
  pw: string;
  name: string;
  desc: string;
  category: string;
  open: string;
  close: string;
  location: VendorLocation;
  isOpen: boolean;
  prep: number;
  minOrder: number;
  deliveryFee: number;
  dishes: Dish[];
  orders: Order[];
  createdAt: number;
}
