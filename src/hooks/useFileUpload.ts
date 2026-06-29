import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext'

type RawRow = Record<string, string | number | boolean | null>

export function useFileUpload() {
  const { dispatch } = useApp()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    setProgress('Reading file...')
    try {
      let rawData: RawRow[]
      if (file.name.toLowerCase().endsWith('.csv')) {
        setProgress('Parsing CSV...')
        const text = await file.text()
        rawData = parseCSV(text)
      } else {
        setProgress('Parsing Excel...')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rawData = (XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]).map(row => {
          const clean: RawRow = {}
          for (const [k, v] of Object.entries(row)) {
            clean[k] = (v instanceof Date) ? v.toISOString() : (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') ? v : String(v)
          }
          return clean
        })
      }
      if (!rawData.length) throw new Error('File is empty or could not be parsed')
      setProgress(`Processing ${rawData.length} tickets...`)
      dispatch({ type: 'SET_RAW_DATA', payload: { raw: rawData, name: file.name } })
      setProgress('Done!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }, [dispatch])

  return { processFile, uploading, progress, error }
}

function parseCSV(text: string): RawRow[] {
  const lines = text.split(/?
/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const row: RawRow = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}
