import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyB9YvFT-uzccwoir9Gofa4CDkR4gM3lF60',
  authDomain: 'oyeride-b6973.firebaseapp.com',
  projectId: 'oyeride-b6973',
  storageBucket: 'oyeride-b6973.firebasestorage.app',
  messagingSenderId: '339897437664',
  appId: '1:339897437664:web:630ee65f16488c3385af85',
  measurementId: 'G-B114PFT2X4',
  databaseURL: 'https://oyeride-b6973-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ignoreUndefinedProperties: Firestore throws if any field value is `undefined`.
// This setting silently drops undefined fields instead of crashing the write.
export const firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

export const database = getDatabase(app);

export default app;
