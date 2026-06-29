import { useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthChange } from '../firebase/auth'
import { db } from '../firebase/config'
import { loadSettings } from '../firebase/firestore'
import { useApp } from '../context/AppContext'
import { DEFAULT_SETTINGS_EXPORT } from '../context/AppContext'
import type { UserProfile } from '../types'

export function useAuth() {
  const { dispatch } = useApp()

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        const profile: UserProfile = snap.exists()
          ? snap.data() as UserProfile
          : { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, photoURL: fbUser.photoURL, role: 'admin', createdAt: new Date() }
        dispatch({ type: 'SET_USER', payload: profile })

        // Load saved settings
        const settings = await loadSettings(fbUser.uid)
        if (settings) dispatch({ type: 'SET_SETTINGS', payload: settings })
        else dispatch({ type: 'SET_SETTINGS', payload: DEFAULT_SETTINGS_EXPORT })
      } else {
        dispatch({ type: 'SET_USER', payload: null })
      }
      dispatch({ type: 'SET_AUTH_LOADING', payload: false })
    })
    return unsub
  }, [dispatch])
}
