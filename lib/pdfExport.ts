/**
 * Digital Passport — PDF Export Utility
 * Generates a branded PDF summary of the user's home passport.
 * Uses jspdf + jspdf-autotable (client-side, no server needed).
 */
import type { WarrantyAsset, Property } from '@/lib/firestore'

// Minimal Snag shape used for export only (avoids cross-file type issues)
interface ExportSnag {
  id: string
  title: string
  location?: string
  urgency?: string
  status?: string
}

// Dynamically import jspdf to avoid SSR issues
async function getJsPDF() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: jsPDF } = await import('jspdf') as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await import('jspdf-autotable') as any
  return jsPDF
}

type StatusType = 'active' | 'expiring' | 'expired'

function warrantyStatus(expiry: string | null): StatusType {
  if (!expiry) return 'expired'
  const diff = new Date(expiry).getTime() - Date.now()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring'
  return 'active'
}

export interface PassportExportData {
  property: Property | null
  assets: WarrantyAsset[]
  snags: ExportSnag[]
  ownerName: string
  ownerEmail: string | null
}

export async function exportPassportPDF(data: PassportExportData): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JsPDF = await getJsPDF()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new JsPDF('p', 'mm', 'a4') as any

  const GOLD: [number, number, number] = [212, 175, 55]
  const DARK: [number, number, number] = [15, 15, 15]
  const GREY: [number, number, number] = [100, 100, 100]
  const LIGHT: [number, number, number] = [220, 220, 220]
  const pageW: number = doc.internal.pageSize.getWidth()

  // ── Cover section ──────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, 50, 'F')

  doc.setTextColor(...GOLD)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('DIGITAL PASSPORT', pageW / 2, 20, { align: 'center' })

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Your Home. Secured.', pageW / 2, 27, { align: 'center' })

  doc.setTextColor(...GOLD)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(data.ownerName, pageW / 2, 38, { align: 'center' })

  if (data.ownerEmail) {
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(data.ownerEmail, pageW / 2, 44, { align: 'center' })
  }

  let y = 58

  // ── Property card ──────────────────────────────────────────────────────────
  if (data.property) {
    const p = data.property
    doc.setFillColor(25, 25, 25)
    doc.roundedRect(14, y, pageW - 28, 34, 3, 3, 'F')
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.4)
    doc.roundedRect(14, y, pageW - 28, 34, 3, 3, 'S')

    doc.setTextColor(...GOLD)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('YOUR PROPERTY', 20, y + 7)

    doc.setTextColor(240, 240, 240)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(p.name, 20, y + 14)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY)
    const details = [p.unit, p.location, p.floorPlanType, p.area > 0 ? `${p.area} sq ft` : null].filter(Boolean).join('  ·  ')
    doc.text(details, 20, y + 21)

    doc.setFontSize(7)
    const gmailStatus = p.gmailLinked ? '✓ Gmail Sync Active' : '○ Gmail Not Connected'
    doc.setTextColor(p.gmailLinked ? 80 : 150, p.gmailLinked ? 180 : 150, p.gmailLinked ? 80 : 150)
    doc.text(gmailStatus, 20, y + 28)
    y += 42
  }

  // ── Stats row ──────────────────────────────────────────────────────────────
  const expiring = data.assets.filter((a) => warrantyStatus(a.warrantyExpiry) === 'expiring').length
  const openSnags = data.snags.filter((s) => s.status === 'open').length
  const statBoxes = [
    { label: 'Total Assets', value: data.assets.length.toString() },
    { label: 'Expiring Soon', value: expiring.toString() },
    { label: 'Open Snags', value: openSnags.toString() },
  ]
  const bw = (pageW - 28) / 3 - 2
  statBoxes.forEach((s, i) => {
    const bx = 14 + i * (bw + 3)
    doc.setFillColor(30, 30, 30)
    doc.roundedRect(bx, y, bw, 18, 2, 2, 'F')
    doc.setTextColor(...GOLD)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(s.value, bx + bw / 2, y + 10, { align: 'center' })
    doc.setTextColor(...GREY)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text(s.label, bx + bw / 2, y + 15, { align: 'center' })
  })
  y += 26

  // ── Warranty Assets Table ──────────────────────────────────────────────────
  if (data.assets.length > 0) {
    doc.setTextColor(...DARK)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Warranty Center', 14, y + 5)
    y += 9

    const rows = data.assets.map((a) => {
      const st = warrantyStatus(a.warrantyExpiry)
      return [
        `${a.icon || ''} ${a.name}`,
        a.brand || '—',
        a.zone || '—',
        a.warrantyExpiry || '—',
        st.toUpperCase(),
      ]
    })

    doc.autoTable({
      head: [['Asset', 'Brand', 'Zone', 'Expires', 'Status']],
      body: rows,
      startY: y,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [20, 20, 20] },
      headStyles: { fillColor: [20, 20, 20], textColor: GOLD, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Snags Table ────────────────────────────────────────────────────────────
  if (data.snags.length > 0) {
    if (y > 220) { doc.addPage(); y = 14 }
    doc.setTextColor(...DARK)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Snag Tracker', 14, y + 5)
    y += 9

    const snagRows = data.snags.map((s) => [
      s.title,
      s.location || '—',
      s.urgency ? s.urgency.charAt(0).toUpperCase() + s.urgency.slice(1) : '—',
      (s.status || '—').replace('-', ' ').toUpperCase(),
    ])

    doc.autoTable({
      head: [['Issue', 'Location', 'Urgency', 'Status']],
      body: snagRows,
      startY: y,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [20, 20, 20] },
      headStyles: { fillColor: [20, 20, 20], textColor: GOLD, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const ph: number = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...LIGHT)
    doc.setLineWidth(0.3)
    doc.line(14, ph - 12, pageW - 14, ph - 12)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY)
    doc.text('Generated by Digital Passport · digitalpassport.peroneira.com', 14, ph - 7)
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, ph - 7, { align: 'right' })
    doc.text(new Date().toLocaleDateString('en-IN'), pageW / 2, ph - 7, { align: 'center' })
  }

  const filename = `Digital-Passport-${(data.property?.name || 'Home').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
