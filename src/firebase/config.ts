import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY as string,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID as string,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
