import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { saveSettings } from '../firebase/firestore'
import { useToast } from '../components/ui/Toast'
import type { DashboardSettings } from '../types'
import clsx from 'clsx'

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold text-sm mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">{title}</h3>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { state, dispatch } = useApp()
  const { toast } = useToast()
  const [settings, setSettings] = useState<DashboardSettings>(state.settings)
  const [saving, setSaving] = useState(false)

  const weightTotal = Object.values(settings.weights).reduce((a, b) => a + b, 0)

  const setNum = (section: 'weights' | 'targets' | 'thresholds', key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
  }

  const setOverride = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      columnOverrides: { ...prev.columnOverrides, [key]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    dispatch({ type: 'SET_SETTINGS', payload: settings })
    if (state.user) {
      await saveSettings(state.user.uid, settings).catch(() => {})
    }
    if (state.rawData.length) {
      dispatch({ type: 'SET_RAW_DATA', payload: { raw: state.rawData, name: state.lastUpload?.name || 'data' } })
    }
    setSaving(false)
    toast('Settings saved!', 'success')
  }

  const numInput = (label: string, section: 'weights' | 'targets' | 'thresholds', key: string, unit = '') => (
    <FormRow label={`${label}${unit ? ` (${unit})` : ''}`}>
      <input
        type="number" className="input"
        value={settings[section][key as keyof typeof settings[typeof section]]}
        onChange={e => setNum(section, key, parseFloat(e.target.value) || 0)}
        min={0} max={section === 'weights' ? 100 : undefined}
      />
    </FormRow>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure KPI targets, score weights, and column mappings</p>
        </div>
        <button className={clsx('btn-primary', saving && 'opacity-70')} onClick={handleSave} disabled={saving || weightTotal !== 100}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SettingsCard title="⚖️ Score Weightages (must total 100%)">
          {numInput('CSAT Weight', 'weights', 'csat', '%')}
          {numInput('Quality Weight', 'weights', 'quality', '%')}
          {numInput('SLA Weight', 'weights', 'sla', '%')}
          {numInput('FRT Weight', 'weights', 'frt', '%')}
          {numInput('Resolution Time Weight', 'weights', 'rt', '%')}
          {numInput('Escalations Weight', 'weights', 'escalations', '%')}
          <div className={clsx('text-xs font-semibold mt-1 px-2 py-1 rounded-lg', weightTotal === 100 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400')}>
            Total: {weightTotal}% {weightTotal === 100 ? '✓' : `— needs to equal 100%`}
          </div>
        </SettingsCard>
        <SettingsCard title="🎯 KPI Targets">
          {numInput('CSAT Target', 'targets', 'csat', '%')}
          {numInput('SLA Target', 'targets', 'sla', '%')}
          {numInput('FCR Target', 'targets', 'fcr', '%')}
          {numInput('FRT Target', 'targets', 'frt', 'hours')}
          {numInput('Resolution Time Target', 'targets', 'rt', 'hours')}
          {numInput('Reopen Rate Target', 'targets', 'reopen', '%')}
        </SettingsCard>
        <SettingsCard title="🎚️ Score Thresholds">
          {numInput('Excellent (score ≥)', 'thresholds', 'excellent')}
          {numInput('Good (score ≥)', 'thresholds', 'good')}
          {numInput('Average (score ≥)', 'thresholds', 'average')}
          <div className="text-xs text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div>• Excellent: ≥ {settings.thresholds.excellent}</div>
            <div>• Good: ≥ {settings.thresholds.good}</div>
            <div>• Average: ≥ {settings.thresholds.average}</div>
            <div>• Needs Improvement: &lt; {settings.thresholds.average}</div>
          </div>
        </SettingsCard>
        <SettingsCard title="🗂️ Custom Column Mapping">
          <p className="text-xs text-gray-500 mb-3">Override auto-detected column names. Leave blank for auto-detection.</p>
          {['agent','id','status','created','csat','frt','resolutionTime','sla','group'].map(field => (
            <FormRow key={field} label={field.charAt(0).toUpperCase() + field.replace(/([A-Z])/g, ' $1').slice(1) + ' Column'}>
              <input type="text" className="input" placeholder="Auto-detect" value={settings.columnOverrides[field] || ''} onChange={e => setOverride(field, e.target.value)} />
            </FormRow>
          ))}
        </SettingsCard>
      </div>
    </div>
  )
}
