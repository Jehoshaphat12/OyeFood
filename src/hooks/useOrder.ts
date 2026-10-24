import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { Order, OrderStatus, Vendor } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Map the customer app's "phase" to the vendor dashboard's "OrderStatus"
const mapPhaseToStatus = (phase: string): OrderStatus => {
  switch (phase) {
    case 'pending': return 'New';
    case 'preparing': return 'Preparing';
    case 'ready': return 'Ready';
    case 'dispatched': return 'Dispatched';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return 'New';
  }
};

// Map Vendor Dashboard action to Firestore phase
const getNextPhase = (current: OrderStatus): string | null => {
  switch (current) {
    case 'New': return 'preparing';
    case 'Preparing': return 'ready';
    case 'Ready': return 'dispatched';
    case 'Dispatched': return 'delivered';
    default: return null; 
  }
};


export const flow: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  New: { next: 'Preparing', label: 'Accept Order' },
  Preparing: { next: 'Ready', label: 'Mark Ready' },
  Ready: { next: 'Dispatched', label: 'Dispatch Order' },
  Dispatched: { next: 'Delivered', label: 'Mark Delivered' }
}
export const ACTIVE: OrderStatus[] = ['Preparing', 'Ready', 'Dispatched']

export function useOrders() {
  const { vendor } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // 1. Listen for incoming orders in Real-Time
  useEffect(() => {
    if (!vendor) {
      setLoadingOrders(false);
      return;
    }

    const q = query(
      collection(firestore, 'rides'),
      where('vehicleType', '==', 'food_delivery'),
      where('foodOrderDetails.vendorId', '==', vendor.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      
      snapshot.forEach((docSnap) => {
        const ride: any = docSnap.data();
        const food = ride.foodOrderDetails;

        if (!food) return;

        fetchedOrders.push({
          id: docSnap.id, 
          customer: ride.passengerName,
          phone: ride.passengerPhone,
          address: food.deliveryAddress || 'Customer Location',
          items: food.items.map((i: any) => ({
            name: i.name,
            qty: i.quantity,
            price: i.basePrice,
            totalPrice: i.totalPrice,
            addons: i.selectedAddons || []
          })),
          total: ride.totalFare,
          deliveryFee: food.deliveryFee,
          payment: food.paymentMethod,
          status: mapPhaseToStatus(food.phase),
          note: food.items[0]?.specialInstructions,
          createdAt: ride.createdAt?.toMillis?.() || Date.now(),
          
          // FIX 1: Read seenByVendor from Firestore, default to false
          seen: food.seenByVendor === true 
        });
      });

      fetchedOrders.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Error listening to orders:", error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [vendor]);

  // 2. Advance Order Status
  const advance = async (order: Order) => {
    const nextPhase = getNextPhase(order.status);
    if (!nextPhase) return;

    try {
      const rideRef = doc(firestore, 'rides', order.id);
      await updateDoc(rideRef, {
        'foodOrderDetails.phase': nextPhase,
        'foodOrderDetails.seenByVendor': true // Ensure it's marked seen when actioned
      });
    } catch (error) {
      console.error("Failed to advance order:", error);
      alert("Failed to update order status.");
    }
  };

  // 3. Reject/Cancel Order
  const reject = async (order: Order) => {
    if (order.status !== 'New') return;
    if (!confirm(`Reject order #${order.id.slice(-6)}?`)) return;

    try {
      const rideRef = doc(firestore, 'rides', order.id);
      await updateDoc(rideRef, {
        status: 'cancelled',
        'foodOrderDetails.phase': 'cancelled',
        'foodOrderDetails.seenByVendor': true,
        cancellationReason: 'Rejected by vendor'
      });
    } catch (error) {
      console.error("Failed to reject order:", error);
    }
  };

  // 4. Dismiss (Stop the pulsing ring)
  const dismiss = async (order: Order) => {
    try {
      const rideRef = doc(firestore, 'rides', order.id);
      await updateDoc(rideRef, {
        'foodOrderDetails.seenByVendor': true
      });
    } catch (error) {
      console.error("Failed to dismiss order:", error);
    }
  };

  // 5. Simulate an order (for testing before the Mobile App is live)
  const simulate = async () => {
    if (!vendor) return;
    if (!vendor.dishes || vendor.dishes.length === 0) {
      return alert('Add at least one available dish first to simulate an order.');
    }

    const availableDishes = vendor.dishes.filter(d => d.available);
    if (availableDishes.length === 0) return alert('No available dishes to simulate.');

    const randomDish = availableDishes[Math.floor(Math.random() * availableDishes.length)];
    const quantity = 1 + Math.floor(Math.random() * 2);
    const unitPrice = randomDish.price;

    const dummyRide = {
      passengerId: "simulated_customer_123",
      passengerName: "Kwame Simulator",
      passengerPhone: "+233 24 000 1122",
      vehicleType: "delivery",
      status: "requesting",
      createdAt: serverTimestamp(),
      totalFare: (unitPrice * quantity) + 10, // 10 is mock delivery fee
      pickup: { 
        latitude: vendor.location.lat, 
        longitude: vendor.location.lng, 
        address: vendor.name 
      },
      destinations: [{ 
        latitude: 5.6037, 
        longitude: -0.1870, 
        address: "Kasoa, Central Region",
        sequence: 1
      }],
      foodOrderDetails: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorImage: "",
        items: [{
          id: "item_1",
          dishId: randomDish.id,
          name: randomDish.name,
          basePrice: randomDish.price,
          quantity: quantity,
          selectedAddons: [],
          imageUrl: randomDish.imageUrl,
          totalPrice: unitPrice * quantity
        }],
        subtotal: unitPrice * quantity,
        deliveryFee: 10,
        paymentMethod: Math.random() > 0.2 ? "MoMo" : "Cash",
        phase: "pending",
        seenByVendor: false,
        deliveryAddress: "Kasoa, Central Region",
        deliveryLocation: { latitude: 5.6037, longitude: -0.1870 },
        estimatedDeliveryTime: "25-35 mins"
      }
    };

    try {
      await addDoc(collection(firestore, 'rides'), dummyRide);
    } catch (error) {
      console.error("Failed to simulate order:", error);
      alert("Failed to simulate order. Check console.");
    }
  };

  return {
    orders,
    loadingOrders,
    advance,
    reject,
    dismiss,
    simulate
  };
}