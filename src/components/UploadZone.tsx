import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MdCloudUpload, MdCheckCircle } from 'react-icons/md'
import { useFileUpload } from '../hooks/useFileUpload'
import { useToast } from './ui/Toast'
import { useApp } from '../context/AppContext'

export function UploadZone() {
  const { processFile, uploading, progress, error } = useFileUpload()
  const { toast } = useToast()
  const { state } = useApp()

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      processFile(files[0])
        .then(() => toast('Data loaded successfully!', 'success'))
        .catch(() => toast('Failed to read file.', 'error'))
    }
  }, [processFile, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
  })

  if (uploading) {
    return (
      <div className="border-2 border-dashed border-brand-300 dark:border-brand-700 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-brand-50/50 dark:bg-brand-950/20 mb-6">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        <div className="text-brand-700 dark:text-brand-300 font-semibold">{progress}</div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 mb-6 ${
        isDragActive
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 scale-[1.01]'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/10'
      }`}
    >
      <input {...getInputProps()} />
      <div className={`p-4 rounded-2xl transition-colors ${isDragActive ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-50 dark:bg-gray-800'}`}>
        <MdCloudUpload className={`w-10 h-10 ${isDragActive ? 'text-brand-600' : 'text-gray-400'}`} />
      </div>
      <div className="text-center">
        <div className="font-bold text-lg text-gray-800 dark:text-gray-100">
          {isDragActive ? 'Drop it!' : 'Upload Freshdesk Export'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Drag & drop CSV or Excel — columns auto-detected, zero manual mapping
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        {['.CSV', '.XLSX', '.XLS'].map(ext => (
          <span key={ext} className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800">
            {ext}
          </span>
        ))}
      </div>
      {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</div>}
      {state.lastUpload && !uploading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
          <MdCheckCircle className="w-4 h-4" />
          {state.lastUpload.name} · {state.lastUpload.rows.toLocaleString()} rows
        </div>
      )}
    </div>
  )
}
