import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { rupiah, formatDate, formatDateTime } from './format'

const GREEN = [37, 116, 73] // #257449
const DARK = [26, 74, 50] // #1a4a32
const GOLD = [198, 144, 42] // #c6902a

const num = (n) => Number(n || 0)

function periodText(range) {
  if (range?.from && range?.to) return `Periode: ${formatDate(range.from)} – ${formatDate(range.to)}`
  if (range?.from) return `Sejak: ${formatDate(range.from)}`
  if (range?.to) return `Sampai: ${formatDate(range.to)}`
  return 'Periode: Semua Transaksi'
}

function fileStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

// Muat logo (public) sebagai dataURL untuk kop PDF
function loadLogo(src = '/logo-landsc.png') {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve({ data: canvas.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Export laporan ke PDF dengan kop elegan. */
export async function exportReportPdf(data, range, settings = {}) {
  const s = data?.summary || {}
  const tx = data?.transactions || []
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = doc.internal.pageSize.getWidth()
  const M = 14

  // ---- Kop ----
  const logo = await loadLogo()
  let headBottom = 14
  if (logo) {
    const w = 44
    const h = w / (logo.ratio || 3)
    doc.addImage(logo.data, 'PNG', M, 10, w, h)
    headBottom = Math.max(headBottom, 10 + h)
  } else {
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(...GREEN)
    doc.text('Bamboe Oerip', M, 18)
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120)
    doc.text('Homestay & Properti', M, 23)
    headBottom = 24
  }

  // Kontak (kanan)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(90)
  const addr = settings.address || 'Jl. Palagan Tentara Pelajar KM 16, Glondong, Purwobinangun, Pakem, Sleman, DI Yogyakarta'
  const phone = settings.contact_phone || '62895338606270'
  const email = settings.contact_email || 'info@bamboeoerip.com'
  const contact = [
    settings.site_name || 'Bamboe Oerip',
    ...doc.splitTextToSize(addr, 90),
    [`Telp: ${phone}`, email].filter(Boolean).join('  ·  '),
  ].filter(Boolean)
  contact.forEach((line, i) => doc.text(String(line), W - M, 13 + i * 4.5, { align: 'right' }))
  const contactBottom = 13 + (contact.length - 1) * 4.5

  // Garis kop (hijau tebal + emas tipis)
  const ry = Math.max(headBottom + 3, contactBottom + 4, 27)
  doc.setDrawColor(...GREEN).setLineWidth(1.1).line(M, ry, W - M, ry)
  doc.setDrawColor(...GOLD).setLineWidth(0.4).line(M, ry + 1.6, W - M, ry + 1.6)

  // ---- Judul laporan ----
  let y = ry + 10
  doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...DARK)
  doc.text('LAPORAN TRANSAKSI', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(90)
  doc.text(periodText(range), M, y + 5.5)
  doc.setFontSize(8).setTextColor(140)
  doc.text(`Dicetak: ${formatDateTime(new Date().toISOString())}`, W - M, y + 5.5, { align: 'right' })

  // ---- Ringkasan ----
  y += 12
  const boxes = [
    ['Jumlah Transaksi', String(s.count ?? tx.length)],
    ['Nilai Transaksi', rupiah(s.total)],
    ['Keuntungan (Biaya Layanan)', rupiah(s.service_fee)],
    ['Total Diskon', rupiah(s.discount)],
  ]
  const bw = (W - M * 2 - 6 * 3) / 4
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 6)
    doc.setFillColor(244, 249, 246).roundedRect(x, y, bw, 16, 2, 2, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(110)
    doc.text(b[0], x + 3, y + 5, { maxWidth: bw - 6 })
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...DARK)
    doc.text(b[1], x + 3, y + 12, { maxWidth: bw - 6 })
  })
  y += 22

  // ---- Tabel transaksi ----
  autoTable(doc, {
    startY: y,
    head: [['Kode', 'Tgl Transaksi', 'Villa', 'Pelanggan', 'Subtotal', 'Diskon', 'Biaya Layanan', 'Total', 'Status']],
    body: tx.map((t) => [
      t.booking_code,
      formatDate(t.created_at),
      t.villa,
      t.customer || t.guest_name || '-',
      rupiah(t.subtotal),
      num(t.discount) > 0 ? `-${rupiah(t.discount)}` : '-',
      rupiah(t.service_fee),
      rupiah(t.total),
      (t.status || '').toUpperCase(),
    ]),
    foot: [[
      { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      rupiah(s.subtotal),
      `-${rupiah(s.discount)}`,
      rupiah(s.service_fee),
      rupiah(s.total),
      '',
    ]],
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [55, 65, 81], lineColor: [235, 238, 240], lineWidth: 0.1 },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [240, 249, 244], textColor: DARK, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' },
    },
    margin: { left: M, right: M },
    didDrawPage: () => {
      const page = doc.internal.getNumberOfPages()
      doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(150)
      doc.text(`Halaman ${page}`, W - M, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
      doc.text('Bamboe Oerip · Laporan dibuat otomatis oleh sistem', M, doc.internal.pageSize.getHeight() - 8)
    },
  })

  doc.save(`Laporan-Transaksi-${fileStamp()}.pdf`)
}

/** Export laporan ke Excel (XLSX). */
export function exportReportExcel(data, range, settings = {}) {
  const s = data?.summary || {}
  const tx = data?.transactions || []

  const addr = settings.address || 'Jl. Palagan Tentara Pelajar KM 16, Glondong, Purwobinangun, Pakem, Sleman, DI Yogyakarta'
  const phone = settings.contact_phone || '62895338606270'
  const email = settings.contact_email || 'info@bamboeoerip.com'

  const aoa = [
    [settings.site_name || 'Bamboe Oerip'],
    [addr],
    [`Telp: ${phone}  ·  ${email}`],
    ['LAPORAN TRANSAKSI'],
    [periodText(range)],
    [`Dicetak: ${formatDateTime(new Date().toISOString())}`],
    [],
    ['Kode', 'Tgl Transaksi', 'Villa', 'Pelanggan', 'Subtotal', 'Diskon', 'Biaya Layanan', 'Total', 'Status'],
    ...tx.map((t) => [
      t.booking_code,
      formatDate(t.created_at),
      t.villa,
      t.customer || t.guest_name || '-',
      num(t.subtotal),
      num(t.discount),
      num(t.service_fee),
      num(t.total),
      t.status,
    ]),
    [],
    ['', '', '', 'TOTAL', num(s.subtotal), num(s.discount), num(s.service_fee), num(s.total), ''],
    [],
    ['Ringkasan'],
    ['Jumlah Transaksi', s.count ?? tx.length],
    ['Nilai Transaksi', num(s.total)],
    ['Keuntungan (Biaya Layanan)', num(s.service_fee)],
    ['Total Diskon', num(s.discount)],
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 20 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ]
  ws['!merges'] = [0, 1, 2, 3, 4, 5].map((r) => ({ s: { r, c: 0 }, e: { r, c: 8 } }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
  XLSX.writeFile(wb, `Laporan-Transaksi-${fileStamp()}.xlsx`)
}
