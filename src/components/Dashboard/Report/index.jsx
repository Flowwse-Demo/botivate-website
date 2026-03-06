"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User } from "lucide-react"
import supabase from "../../../supabaseClient.js"

import ReportStats from "./ReportStats"
import ReportFilters from "./ReportFilters"
import ReportTable from "./ReportTable"
import { exportToCSV as exportToCSVHelper, exportToPDF as exportToPDFHelper } from "./exportHelpers"

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

  const handleExportToCSV = (type) => exportToCSVHelper(type, stats, reportsData, filteredData)
  const handleExportToPDF = () => exportToPDFHelper(stats, reportsData, dateRange)

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

        <ReportFilters 
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          exportToPDF={handleExportToPDF}
          exportToCSV={handleExportToCSV}
        />

        <ReportStats stats={stats} />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredData.length}</span> tasks
            {dateRange.startDate && dateRange.endDate && 
              ` for ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
            }
          </p>
        </div>

        <ReportTable 
          stats={stats}
          reportsData={reportsData}
          exportToCSV={handleExportToCSV}
        />
        
      </motion.div>
    </div>
  )
}

export default ReportsPage
