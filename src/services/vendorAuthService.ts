import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { Vendor } from '../types';

export class VendorAuthService {
  static async register(input: any): Promise<Vendor> {
    const { email, password, owner, phone, name, desc, category, open, close, location } = input;
    
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    
    const newVendor: Vendor = {
      id: credential.user.uid,
      owner,
      email,
      phone,
      name,
      desc,
      category,
      open,
      close,
      location,
      isOpen: true,
      prep: 20,
      minOrder: 20,
      deliveryFee: 10,
      dishes: [],
      orders: [], // Note: We actually don't store orders inside the vendor doc anymore, but keeping it for type compatibility
      createdAt: Date.now(),
      pw: '', // Never store plain text passwords. Auth handles this.
    };

    await setDoc(doc(firestore, 'vendors', newVendor.id), newVendor);
    return newVendor;
  }

  static async login(idOrEmail: string, password: string): Promise<Vendor> {
    let emailToUse = idOrEmail.trim().toLowerCase();

    // Check if the user typed a phone number instead of an email
    if (!emailToUse.includes('@')) {
      // Look up the vendor by phone number to get their email
      const q = query(collection(firestore, 'vendors'), where('phone', '==', idOrEmail));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        throw new Error("No vendor found with this phone number.");
      }
      emailToUse = snap.docs[0].data().email;
    }

    // Now login with the email
    const credential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const vendorDoc = await getDoc(doc(firestore, 'vendors', credential.user.uid));
    
    if (!vendorDoc.exists()) {
      throw new Error("Vendor account not found in database.");
    }
    return vendorDoc.data() as Vendor;
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }
}