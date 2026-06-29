import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { AgentStats } from '../types'

export function exportAgentsToExcel(agents: AgentStats[], filename = 'freshdesk_performance.xlsx') {
  const rows = [[
    'Agent', 'Group', 'Assigned', 'Resolved', 'Resolution Rate %',
    'Avg FRT (h)', 'Avg Res.Time (h)', 'CSAT %', 'SLA %',
    'Reopens', 'Escalations', 'Score',
  ]]
  agents.sort((a, b) => b.score - a.score).forEach(s => {
    rows.push([
      s.agent, s.group, String(s.assigned), String(s.resolved),
      s.resolutionRate.toFixed(1), s.avgFrt.toFixed(2), s.avgRt.toFixed(2),
      s.avgCsat.toFixed(1), s.slaRate.toFixed(1), String(s.reopens),
      String(s.escalations), String(s.score),
    ])
  })
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance')
  XLSX.writeFile(wb, filename)
}

export async function exportDashboardToPDF(elementId: string, filename = 'dashboard.pdf') {
  const el = document.getElementById(elementId)
  if (!el) return
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const w = pdf.internal.pageSize.getWidth()
  const h = (canvas.height * w) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, w, h)
  pdf.save(filename)
}
