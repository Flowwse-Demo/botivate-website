"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Download, 
  Filter, 
  User, 
  Building2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Calendar,
  Users,
  TrendingUp,
  PieChart,
  FilePieChart,
  Download as DownloadIcon
} from "lucide-react"
import supabase from "../../supabaseClient.js"
import jsPDF from "jspdf"
import "jspdf-autotable"

const ReportsPage = () => {
  const [reportsData, setReportsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userInfo, setUserInfo] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  })
  const [stats, setStats] = useState({
    totalPending: 0,
    byCompany: {},
    byPerson: {},
    todayTasks: 0,
    upcomingTasks: 0,
    overdueTasks: 0,
    companyPersonDistribution: {}
  })

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = () => {
      let userData = null
      
      const storedSession = sessionStorage.getItem('userSession')
      if (storedSession) {
        try {
          userData = JSON.parse(storedSession)
        } catch (e) {
          console.error("Error parsing session data:", e)
        }
      }
      
      if (!userData) {
        const storedUsername = localStorage.getItem('tempUsername')
        if (storedUsername) {
          userData = { username: storedUsername }
        }
      }
      
      setUserInfo(userData)
    }
    
    fetchUserInfo()
  }, [])

  // Fetch reports data from Supabase
  useEffect(() => {
    fetchReportsData()
  }, [dateRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('FMS')
        .select('*')
        .or('status.eq.Pending,status.eq.In Progress,status.is.null')
        .order('timestamp', { ascending: false })

      // Apply date filter if dates are selected
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day

        query = query
          .gte('planned3', startDate.toISOString())
          .lte('planned3', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      console.log("Fetched reports data:", data)
      setReportsData(data || [])
      setFilteredData(data || [])
      
      // Calculate statistics
      calculateStats(data || [])
      
    } catch (error) {
      console.error("Error fetching reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const stats = {
      totalPending: data.length,
      byCompany: {},
      byPerson: {},
      todayTasks: 0,
      upcomingTasks: 0,
      overdueTasks: 0,
      companyPersonDistribution: {}
    }
    
    data.forEach(task => {
      // Count by company (party_name)
      const company = task.party_name || 'Unknown Company'
      stats.byCompany[company] = (stats.byCompany[company] || 0) + 1
      
      // Count by person (employee_name_1)
      const person = task.employee_name_1 || task.team_member_name || task.assigned_by || 'Unassigned'
      stats.byPerson[person] = (stats.byPerson[person] || 0) + 1
      
      // Initialize company-person distribution
      if (!stats.companyPersonDistribution[company]) {
        stats.companyPersonDistribution[company] = {}
      }
      stats.companyPersonDistribution[company][person] = (stats.companyPersonDistribution[company][person] || 0) + 1
      
      // Check task deadlines
      if (task.planned3) {
        const expectedDate = new Date(task.planned3)
        
        if (expectedDate.toDateString() === today.toDateString()) {
          stats.todayTasks++
        } else if (expectedDate > today) {
          stats.upcomingTasks++
        } else if (expectedDate < today) {
          stats.overdueTasks++
        }
      }
    })
    
    setStats(stats)
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...reportsData]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        (task.task_no && task.task_no.toLowerCase().includes(query)) ||
        (task.party_name && task.party_name.toLowerCase().includes(query)) ||
        (task.employee_name_1 && task.employee_name_1.toLowerCase().includes(query)) ||
        (task.system_name && task.system_name.toLowerCase().includes(query))
      )
    }
    
    setFilteredData(filtered)
  }, [searchQuery, reportsData])

  // Get unique companies and persons for dropdowns
  const uniqueCompanies = [...new Set(reportsData.map(task => task.party_name).filter(Boolean))]
  const uniquePersons = [...new Set(reportsData.map(task => task.employee_name_1).filter(Boolean))]

  const exportToCSV = (type = 'full') => {
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

  const exportToPDF = () => {
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

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeadlineStatus = (expectedDate) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Distribution Reports</h1>
              <p className="text-gray-600 mt-2">
                View task distribution by company and person with deadline analysis
              </p>
            </div>
            
            {userInfo && (
              <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userInfo.role || 'user'}
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Date Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Filter by Date Range:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setDateRange({ startDate: "", endDate: "" })}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors h-[42px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalPending}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FilePieChart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.todayTasks}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.upcomingTasks}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.overdueTasks}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by company, person, or task..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportToPDF()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => exportToCSV('full')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV (Full)
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredData.length}</span> tasks
              {dateRange.startDate && dateRange.endDate && 
                ` for ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
              }
            </p>
          </div>

          {/* Company Distribution Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Task Distribution by Company</h2>
                </div>
                <button
                  onClick={() => exportToCSV('company-summary')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <DownloadIcon className="w-3 h-3" />
                  Export
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Shows how tasks are distributed between companies and persons
              </p>
            </div>
            
            {Object.keys(stats.companyPersonDistribution).length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Persons
                      </th>
                      <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Distribution (Person: Count)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(stats.companyPersonDistribution)
                      .sort(([,a], [,b]) => Object.values(b).reduce((sum, val) => sum + val, 0) - 
                                           Object.values(a).reduce((sum, val) => sum + val, 0))
                      .map(([company, persons]) => {
                        const totalTasks = stats.byCompany[company] || 0
                        const todayTasks = reportsData
                          .filter(task => task.party_name === company && 
                                 getDeadlineStatus(task.planned3) === 'today').length
                        const upcomingTasks = reportsData
                          .filter(task => task.party_name === company && 
                                 getDeadlineStatus(task.planned3) === 'upcoming').length
                        const overdueTasks = reportsData
                          .filter(task => task.party_name === company && 
                                 getDeadlineStatus(task.planned3) === 'overdue').length
                        
                        return (
                          <tr key={company} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">{company}</p>
                                <p className="text-sm text-gray-500">
                                  {reportsData.filter(t => t.party_name === company)[0]?.system_name || 'No System'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-blue-600 text-lg">{totalTasks}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(persons).map(person => (
                                  <span key={person} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                    <User className="w-3 h-3 mr-1" />
                                    {person}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {Object.entries(persons)
                                  .sort(([,a], [,b]) => b - a)
                                  .map(([person, count]) => (
                                    <div key={person} className="flex items-center justify-between">
                                      <span className="text-gray-700">{person}</span>
                                      <span className="font-semibold">{count}</span>
                                    </div>
                                  ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {todayTasks > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    Today: {todayTasks}
                                  </span>
                                )}
                                {upcomingTasks > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                    Upcoming: {upcomingTasks}
                                  </span>
                                )}
                                {overdueTasks > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                    Overdue: {overdueTasks}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Person Distribution Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Task Distribution by Person</h2>
                </div>
                <button
                  onClick={() => exportToCSV('person-summary')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  <DownloadIcon className="w-3 h-3" />
                  Export
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Shows how many pending tasks each person has and their companies
              </p>
            </div>
            
            {Object.keys(stats.byPerson).length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Companies
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline Breakdown
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(stats.byPerson)
                      .sort(([,a], [,b]) => b - a)
                      .map(([person, count]) => {
                        const personTasks = reportsData.filter(task => 
                          task.employee_name_1 === person || task.team_member_name === person
                        )
                        const companies = [...new Set(personTasks.map(t => t.party_name).filter(Boolean))]
                        const todayTasks = personTasks.filter(t => 
                          getDeadlineStatus(t.planned3) === 'today').length
                        const upcomingTasks = personTasks.filter(t => 
                          getDeadlineStatus(t.planned3) === 'upcoming').length
                        const overdueTasks = personTasks.filter(t => 
                          getDeadlineStatus(t.planned3) === 'overdue').length
                        
                        return (
                          <tr key={person} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                  <User className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{person}</p>
                                  <p className="text-sm text-gray-500">
                                    {personTasks[0]?.team_name || 'No Team'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-purple-600 text-lg">{count}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {companies.map(company => (
                                  <span key={company} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {company}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="text-sm text-gray-700 truncate">
                                  {personTasks.slice(0, 3).map(task => task.task_no).filter(Boolean).join(', ')}
                                  {personTasks.length > 3 && ` and ${personTasks.length - 3} more...`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Latest: {personTasks[0]?.description_of_work?.substring(0, 50)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Today:</span>
                                  <span className="font-semibold text-green-600">{todayTasks}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Upcoming:</span>
                                  <span className="font-semibold text-blue-600">{upcomingTasks}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Overdue:</span>
                                  <span className="font-semibold text-red-600">{overdueTasks}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Cards at Bottom */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Companies */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Companies by Tasks</h3>
                <PieChart className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                {Object.entries(stats.byCompany)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([company, count]) => (
                    <div key={company} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-gray-700 truncate">{company}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-blue-600 mr-2">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({((count / stats.totalPending) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Persons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Persons by Tasks</h3>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div className="space-y-3">
                {Object.entries(stats.byPerson)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([person, count]) => (
                    <div key={person} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-gray-700 truncate">{person}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-purple-600 mr-2">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({((count / stats.totalPending) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
}

export default ReportsPage