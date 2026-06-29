import {
  signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged, User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  await upsertUserProfile(result.user)
  return result.user
}

export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await upsertUserProfile(result.user, displayName)
  return result.user
}

export const logout = () => signOut(auth)

export const onAuthChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb)

async function upsertUserProfile(user: User, displayName?: string) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      role: 'admin',
      createdAt: serverTimestamp(),
    })
  }
}
