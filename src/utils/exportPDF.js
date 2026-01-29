import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function exportStatsToPDF(leads, showName, stats) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(24)
  doc.setTextColor(27, 42, 74) // Navy
  doc.text('Stone Rose', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(100)
  doc.text(`${showName} - Lead Report`, pageWidth / 2, 28, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, 35, { align: 'center' })

  // Summary Stats
  doc.setFontSize(16)
  doc.setTextColor(27, 42, 74)
  doc.text('Summary', 14, 50)

  doc.setFontSize(11)
  doc.setTextColor(60)

  const summaryData = [
    ['Total Leads', stats.total.toString()],
    ['Hot Leads', stats.temperature.hot.toString()],
    ['Warm Leads', stats.temperature.warm.toString()],
    ['Browsing', stats.temperature.browsing.toString()]
  ]

  doc.autoTable({
    startY: 55,
    head: [['Metric', 'Count']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [27, 42, 74] },
    margin: { left: 14, right: 14 },
    tableWidth: 80
  })

  // Interests breakdown
  const interestsY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(16)
  doc.setTextColor(27, 42, 74)
  doc.text('Interests Breakdown', 14, interestsY)

  const interestsData = [
    ['New Account', stats.interests.newAccount.toString()],
    ['Reorder', stats.interests.reorder.toString()],
    ['SS26', stats.interests.ss26.toString()],
    ['F26', stats.interests.f26.toString()],
    ['Core', stats.interests.core.toString()]
  ]

  doc.autoTable({
    startY: interestsY + 5,
    head: [['Interest', 'Count']],
    body: interestsData,
    theme: 'striped',
    headStyles: { fillColor: [201, 169, 98] },
    margin: { left: 14, right: 14 },
    tableWidth: 80
  })

  // Top States
  if (stats.byState.length > 0) {
    const statesY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(16)
    doc.setTextColor(27, 42, 74)
    doc.text('Top States', 14, statesY)

    const statesData = stats.byState.slice(0, 10).map((item, index) => [
      `#${index + 1}`,
      item.state,
      item.count.toString(),
      `${item.percentage}%`
    ])

    doc.autoTable({
      startY: statesY + 5,
      head: [['Rank', 'State', 'Leads', '%']],
      body: statesData,
      theme: 'striped',
      headStyles: { fillColor: [27, 42, 74] },
      margin: { left: 14, right: 14 },
      tableWidth: 100
    })
  }

  // Staff Performance
  if (stats.byStaff.length > 0) {
    const staffY = doc.lastAutoTable.finalY + 15

    // Check if we need a new page
    if (staffY > 250) {
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(27, 42, 74)
      doc.text('Staff Performance', 14, 20)

      const staffData = stats.byStaff.map((item, index) => [
        `#${index + 1}`,
        item.staff,
        item.count.toString(),
        `${item.percentage}%`
      ])

      doc.autoTable({
        startY: 25,
        head: [['Rank', 'Staff', 'Leads', '%']],
        body: staffData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
        tableWidth: 100
      })
    } else {
      doc.setFontSize(16)
      doc.setTextColor(27, 42, 74)
      doc.text('Staff Performance', 14, staffY)

      const staffData = stats.byStaff.map((item, index) => [
        `#${index + 1}`,
        item.staff,
        item.count.toString(),
        `${item.percentage}%`
      ])

      doc.autoTable({
        startY: staffY + 5,
        head: [['Rank', 'Staff', 'Leads', '%']],
        body: staffData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
        tableWidth: 100
      })
    }
  }

  // Add new page for leads list
  doc.addPage()
  doc.setFontSize(16)
  doc.setTextColor(27, 42, 74)
  doc.text('All Leads', 14, 20)

  const leadsData = leads.map(lead => [
    lead.contactName || '',
    lead.storeName || '',
    lead.email || '',
    lead.phone || '',
    `${lead.city || ''}, ${lead.state || ''}`.replace(', ,', '').replace(/^, |, $/g, ''),
    lead.temperature || '',
    (lead.interests || []).join(', ')
  ])

  doc.autoTable({
    startY: 25,
    head: [['Contact', 'Store', 'Email', 'Phone', 'Location', 'Temp', 'Interests']],
    body: leadsData,
    theme: 'striped',
    headStyles: { fillColor: [27, 42, 74], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 10, right: 10 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 30 }
    }
  })

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} - Stone Rose Booth Traffic Logger`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save
  const filename = `stone-rose-${showName.toLowerCase().replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)

  return filename
}
