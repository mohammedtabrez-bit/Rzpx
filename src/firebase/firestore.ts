import {
  collection, doc, setDoc, getDoc, getDocs,
  query, orderBy, limit, deleteDoc, serverTimestamp,
  Timestamp, where,
} from 'firebase/firestore'
import { db } from './config'
import type { DashboardSettings, UploadRecord } from '../types'

// ── Settings ──────────────────────────────────────────
export const saveSettings = async (uid: string, settings: DashboardSettings) => {
  await setDoc(doc(db, 'configurations', uid), { ...settings, updatedAt: serverTimestamp() })
}

export const loadSettings = async (uid: string): Promise<DashboardSettings | null> => {
  const snap = await getDoc(doc(db, 'configurations', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return { weights: data.weights, targets: data.targets, thresholds: data.thresholds, columnOverrides: data.columnOverrides || {} }
}

// ── Upload Records ────────────────────────────────────
export const saveUploadRecord = async (record: Omit<UploadRecord, 'id'>) => {
  const ref = doc(collection(db, 'uploads'))
  await setDoc(ref, { ...record, uploadedAt: serverTimestamp() })
  return ref.id
}

export const getUploadHistory = async (uid: string): Promise<UploadRecord[]> => {
  const q = query(
    collection(db, 'uploads'),
    where('uploadedBy', '==', uid),
    orderBy('uploadedAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    uploadedAt: d.data().uploadedAt instanceof Timestamp ? d.data().uploadedAt.toDate() : new Date(),
  })) as UploadRecord[]
}

export const deleteUploadRecord = async (id: string) => {
  await deleteDoc(doc(db, 'uploads', id))
}

// ── Performance Reports ───────────────────────────────
export const saveReport = async (uid: string, reportId: string, data: object) => {
  await setDoc(doc(db, 'performanceReports', `${uid}_${reportId}`), {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: uid,
  })
}
