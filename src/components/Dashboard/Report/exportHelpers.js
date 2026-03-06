import jsPDF from "jspdf"
import "jspdf-autotable"

export const exportToCSV = (type = 'full', stats, reportsData, filteredData) => {
  let headers, rows
  
  if (type === 'company-summary') {
    headers = ['Company', 'Total Tasks', 'Persons', 'Task Distribution']
    rows = Object.entries(stats.companyPersonDistribution).map(([company, persons]) => {
      const total = stats.byCompany[company] || 0
      const personList = Object.entries(persons)
        .map(([person, count]) => `${person}(${count})`)
        .join(', ')
      return [`"${company}"`, total, Object.keys(persons).length, `"${personList}"`]
    })
  } else if (type === 'person-summary') {
    headers = ['Person', 'Total Tasks', 'Companies', 'Task Details']
    rows = Object.entries(stats.byPerson).map(([person, count]) => {
      const companies = reportsData
        .filter(task => (task.employee_name_1 === person || task.team_member_name === person))
        .map(task => task.party_name)
      const uniqueCompanies = [...new Set(companies)].join(', ')
      const taskNos = reportsData
        .filter(task => (task.employee_name_1 === person || task.team_member_name === person))
        .map(task => task.task_no)
        .filter(Boolean)
        .join(', ')
      return [`"${person}"`, count, `"${uniqueCompanies}"`, `"${taskNos}"`]
    })
  } else {
    headers = ['Task No', 'Company', 'Person', 'System', 'Expected Date', 'Planned Date', 'Status', 'Priority']
    rows = filteredData.map(task => [
      `"${task.task_no || ''}"`,
      `"${task.party_name || ''}"`,
      `"${task.employee_name_1 || task.team_member_name || 'Unassigned'}"`,
      `"${task.system_name || ''}"`,
      `"${task.planned3 || ''}"`,
      `"${task.planned3 ? new Date(task.planned3).toLocaleDateString() : ''}"`,
      `"${task.status || 'Pending'}"`,
      `"${task.priority_in_customer || 'Medium'}"`
    ])
  }
  
  const csvRows = [headers.join(','), ...rows]
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reports-${type}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const exportToPDF = (stats, reportsData, dateRange) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  // Title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text("Task Reports Summary", pageWidth / 2, 20, { align: 'center' })
  
  // Date Range
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const dateText = dateRange.startDate && dateRange.endDate 
    ? `Date Range: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
    : 'All Time'
  doc.text(dateText, pageWidth / 2, 30, { align: 'center' })
  
  // Stats
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Overview Statistics", 14, 45)
  
  const statsData = [
    ['Total Pending Tasks', stats.totalPending],
    ['Today Tasks', stats.todayTasks],
    ['Upcoming Tasks', stats.upcomingTasks],
    ['Overdue Tasks', stats.overdueTasks]
  ]
  
  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Count']],
    body: statsData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 }
  })
  
  // Company Distribution Table
  doc.addPage()
  doc.setFontSize(16)
  doc.text("Task Distribution by Company", pageWidth / 2, 20, { align: 'center' })
  
  const companyData = Object.entries(stats.companyPersonDistribution)
    .sort(([,a], [,b]) => Object.values(b).reduce((sum, val) => sum + val, 0) - 
                         Object.values(a).reduce((sum, val) => sum + val, 0))
    .map(([company, persons]) => {
      const totalTasks = stats.byCompany[company] || 0
      const personDistribution = Object.entries(persons)
        .map(([person, count]) => `${person}: ${count}`)
        .join(', ')
      return [company, totalTasks, Object.keys(persons).length, personDistribution]
    })
  
  doc.autoTable({
    startY: 30,
    head: [['Company', 'Total Tasks', 'Persons', 'Distribution']],
    body: companyData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 100 }
    }
  })
  
  // Person Distribution Table
  doc.addPage()
  doc.setFontSize(16)
  doc.text("Task Distribution by Person", pageWidth / 2, 20, { align: 'center' })
  
  const personData = Object.entries(stats.byPerson)
    .sort(([,a], [,b]) => b - a)
    .map(([person, count]) => {
      const companies = reportsData
        .filter(task => (task.employee_name_1 === person || task.team_member_name === person))
        .map(task => task.party_name)
      const uniqueCompanies = [...new Set(companies)].join(', ')
      return [person, count, uniqueCompanies]
    })
  
  doc.autoTable({
    startY: 30,
    head: [['Person', 'Total Tasks', 'Companies']],
    body: personData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
    margin: { left: 14, right: 14 }
  })
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, pageHeight - 10)
  }
  
  doc.save(`reports-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const getDeadlineStatus = (expectedDate) => {
  if (!expectedDate) return 'no-deadline'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expected = new Date(expectedDate)
  
  if (expected.toDateString() === today.toDateString()) {
    return 'today'
  } else if (expected > today) {
    return 'upcoming'
  } else {
    return 'overdue'
  }
}
