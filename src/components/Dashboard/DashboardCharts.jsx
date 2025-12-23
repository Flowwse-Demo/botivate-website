"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react"
import supabase from "../../supabaseClient"

// Function to fetch data from Supabase (FMS table)
const fetchSheetData = async () => {
  try {
    // Select all columns from FMS table
    const { data, error } = await supabase
      .from("FMS")
      .select("*")

    if (error) {
      throw error
    }

    // Ensure we always return an array
    if (Array.isArray(data)) {
      return data
    }

    return []
  } catch (error) {
    console.error("Error fetching Supabase data:", error)
    return null
  }
}

// Fetch data from Master_Sheet_Link table in Supabase
const fetchMasterSheetLinkData = async () => {
  try {
    const { data, error } = await supabase
      .from("dropdown")
      .select("*")

    if (error) throw error

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching Master Sheet Link data:", error)
    return []
  }
}

// Function to get party names that match the logged-in company
const getCompanyPartyNames = (companyName, masterSheetData) => {
  if (!companyName || !masterSheetData || !Array.isArray(masterSheetData)) {
    return []
  }

  const matchingParties = []

  for (const row of masterSheetData) {
    if (!row || typeof row !== "object") continue

    // Assuming Supabase table has column names like company_name, col_g, col_h, col_i
    const companyNameInSheet = row.company_name ? row.company_name.toString().trim() : ""

    if (companyNameInSheet.toLowerCase() === companyName.toLowerCase()) {
      // Collect possible party names
      const possiblePartyColumns = [
        row.company_name,
        row.col_g,
        row.col_h,
        row.col_i,
      ]

      for (const col of possiblePartyColumns) {
        if (col) {
          const partyName = col.toString().trim()
          if (partyName && !matchingParties.includes(partyName)) {
            matchingParties.push(partyName)
          }
        }
      }

      // If no mapping found, fallback to company name
      if (matchingParties.length === 0) {
        matchingParties.push(companyNameInSheet)
      }
    }
  }

  return matchingParties
}

// Function to filter data for company users
const filterCompanyData = (dataRows, companyData, masterSheetData) => {
  if (!companyData || !companyData.companyName) {
    return dataRows
  }

  const matchingPartyNames = getCompanyPartyNames(companyData.companyName, masterSheetData)

  if (matchingPartyNames.length > 0) {
    return dataRows.filter(row => {
      const partyName = row.party_name ? row.party_name.toString().trim() : ''
      
      // Check if party name matches any of the company's party names
      return matchingPartyNames.some(companyParty => 
        partyName.toLowerCase() === companyParty.toLowerCase()
      )
    })
  } else {
    // Fallback: direct company name matching
    return dataRows.filter(row => {
      const partyName = row.party_name ? row.party_name.toString().trim().toLowerCase() : ''
      const companyNameLower = companyData.companyName.toLowerCase()

      return partyName === companyNameLower
    })
  }
}

// Function to filter data for user role - filter by employee_name_1 column
const filterUserData = (dataRows, userFilterData) => {
  if (!userFilterData) return dataRows

  const userName = userFilterData.username || userFilterData.name
  if (!userName) return dataRows

  return dataRows.filter(row => {
    const employeeName = row.employee_name_1?.toString().trim() || ''
    return employeeName.toLowerCase() === userName.toLowerCase()
  })
}

// Function to process Supabase data for charts with company and user filtering
const processSupabaseData = (supabaseData, userRole, companyData, masterSheetData, userFilterData) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return {
      taskCompletionData: [],
      projectStatusData: [],
      teamPerformanceData: [],
      totalCompleted: 0,
      totalPending: 0,
      totalTasks: 0
    }
  }

  let dataRows = [...supabaseData]

  // Filter data based on user role
  if (userRole === 'company') {
    dataRows = filterCompanyData(dataRows, companyData, masterSheetData)
  } else if (userRole === 'user') {
    dataRows = filterUserData(dataRows, userFilterData)
  }

  // Process data to get totals and team performance
  const teamMap = new Map()
  const monthlyData = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Initialize monthly data with all months
  monthNames.forEach((month, index) => {
    monthlyData[index] = {
      month,
      completed: 0,
      pending: 0,
      total: 0
    }
  })

  let totalCompleted = 0
  let totalPending = 0
  let totalTasks = 0

  dataRows.forEach(row => {
    // Check if planned3 (AB column equivalent) has data
    const plannedHasData = row.planned3 && row.planned3.toString().trim() !== ''
    const actualHasData = row.actual3 && row.actual3.toString().trim() !== ''

    if (!plannedHasData && !actualHasData) return // Skip if no data

    // Get date from timestamp or created_at
    let date = new Date()
    if (row.timestamp) {
      try {
        date = new Date(row.timestamp)
      } catch (e) {
        // If timestamp parsing fails, try created_at
        if (row.created_at) {
          try {
            date = new Date(row.created_at)
          } catch (e) {
            date = new Date()
          }
        }
      }
    }

    const month = date.getMonth()

    // Count totals
    totalTasks++
    monthlyData[month].total++

    if (plannedHasData && actualHasData) {
      totalCompleted++
      monthlyData[month].completed++
    } else if (plannedHasData) {
      totalPending++
      monthlyData[month].pending++
    }

    // Process team data (only for admin)
    if (userRole === 'admin') {
      const teamName = row.team_name ? row.team_name.toString().trim() : 'No Team'
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          name: teamName,
          tasks: 0,
          completed: 0,
          efficiency: 0
        })
      }

      const team = teamMap.get(teamName)
      team.tasks++

      if (plannedHasData && actualHasData) {
        team.completed++
      }
    }
  })

  // Calculate team efficiencies and ensure we have 3 teams (admin only)
  let teamPerformanceData = []
  if (userRole === 'admin') {
    // Process existing teams
    teamMap.forEach(team => {
      team.efficiency = team.tasks > 0 ? Math.round((team.completed / team.tasks) * 100) : 0
      teamPerformanceData.push(team)
    })

    // Sort teams by tasks count for better display
    teamPerformanceData.sort((a, b) => b.tasks - a.tasks)

    // Create exactly 3 teams - merge data from sheet with default teams
    const defaultTeams = ['Team 1', 'Team 2', 'Team 3']
    const finalTeamData = []
    
    // Distribute existing teams into the 3 default teams
    for (let i = 0; i < 3; i++) {
      const teamName = defaultTeams[i]
      let teamStats = {
        name: teamName,
        tasks: 0,
        completed: 0,
        efficiency: 0
      }
      
      // If we have actual team data, use it for this slot
      if (teamPerformanceData[i]) {
        teamStats = {
          name: teamName,
          tasks: teamPerformanceData[i].tasks,
          completed: teamPerformanceData[i].completed,
          efficiency: teamPerformanceData[i].efficiency
        }
      }
      
      finalTeamData.push(teamStats)
    }
    
    // Replace the teamPerformanceData with our fixed 3-team structure
    teamPerformanceData = finalTeamData
  }

  // Prepare task completion data - include all months even with no data
  const taskCompletionData = Object.values(monthlyData)
    .sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month))

  // Prepare project status data
  const projectStatusData = [
    { name: "Completed", value: totalCompleted, color: "#10B981" },
    { name: "Pending", value: totalPending, color: "#F59E0B" },
  ].filter(item => item.value > 0)

  return {
    taskCompletionData,
    projectStatusData,
    teamPerformanceData,
    totalCompleted,
    totalPending,
    totalTasks
  }
}

export default function DashboardCharts({ userRole, companyData, userFilterData }) {
  const [activeChart, setActiveChart] = useState("completion")
  const [chartData, setChartData] = useState({
    taskCompletionData: [],
    projectStatusData: [],
    teamPerformanceData: [],
    totalCompleted: 0,
    totalPending: 0,
    totalTasks: 0
  })
  const [loading, setLoading] = useState(true)
  const [masterSheetData, setMasterSheetData] = useState(null)

  // Fetch data for all roles
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true)

      try {
        // Fetch Master Sheet Link data first if company user
        let masterData = null
        if (userRole === 'company' && companyData) {
          masterData = await fetchMasterSheetLinkData()
          setMasterSheetData(masterData)
        }

        // Fetch FMS data
        const data = await fetchSheetData()
        if (data) {
          const processedData = processSupabaseData(data, userRole, companyData, masterData, userFilterData)
          setChartData(processedData)
        }
      } catch (error) {
        console.error('Error loading chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [userRole, companyData, userFilterData])

  const chartTabs = [
    { id: "completion", label: "Task Completion", icon: CheckCircle },
    { id: "status", label: "Project Status", icon: TrendingUp },
  ]

  // Filter tabs based on user role
  const filteredTabs = userRole === 'admin' 
    ? [...chartTabs]
    : chartTabs

  const renderChart = (chartId = activeChart) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading chart data...</span>
        </div>
      )
    }

    switch (chartId) {
      case "completion":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280" 
                ticks={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
              />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                stroke="#10B981"
                fill="#10B98133"
                strokeWidth={2}
                name="Completed"
              />
              <Area
                type="monotone"
                dataKey="pending"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B33"
                strokeWidth={2}
                name="Pending"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "performance":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData.teamPerformanceData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name, props) => {
                  if (props.dataKey === 'efficiency') {
                    return [`${value}%`, 'Efficiency']
                  }
                  return [value, 'Total Tasks']
                }}
              />
              <Bar 
                dataKey="tasks" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]} 
                name="Total Tasks" 
                barSize={30}
              />
              <Bar 
                dataKey="efficiency" 
                fill="#8B5CF6" 
                radius={[4, 4, 0, 0]} 
                name="Efficiency" 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case "status":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Company Users: Only Two Charts Side by Side */}
      {userRole === "company" ? (
        <div className="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-2">
          {/* Left: Task Completion Chart */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Task Completion</h2>
            {renderChart("completion")}
          </div>

          {/* Right: Project Status Chart */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Project Status</h2>
            {renderChart("status")}
          </div>
        </div>
      ) : (
        <>
          {/* Admin + User Original Layout */}
          {/* Main Chart */}
          <div className="bg-white border border-gray-200 shadow-sm lg:col-span-3 rounded-2xl"> {/* Changed from lg:col-span-2 to lg:col-span-3 */}
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">
        {userRole === 'admin' ? 'Analytics Dashboard' : 'My Performance'}
      </h2>
      <div className="flex items-center space-x-2">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === tab.id
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
  <div className="p-6">{renderChart()}</div>
</div>


          {/* Stats + Insights Section */}
          <div className="space-y-6">
            {/* Quick Stats */}
            {/* <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Total Tasks</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {loading ? "..." : chartData.totalTasks}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Tasks Completed</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {loading ? "..." : chartData.totalCompleted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-600">Pending Tasks</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {loading ? "..." : chartData.totalPending}
                  </span>
                </div>
              </div>
            </div> */}

            {/* Project Status Legend */}
            {activeChart === "status" && !loading && (
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Project Status</h3>
                <div className="space-y-3">
                  {chartData.projectStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Performance Details (Admin only) */}
            {/* {activeChart === "performance" && userRole === 'admin' && !loading && (
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Team Performance Details</h3>
                <div className="space-y-3">
                  {chartData.teamPerformanceData.map((team, index) => (
                    <div key={index} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{team.name}</span>
                        <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded">
                          {team.efficiency}% Efficiency
                        </span>
                      </div>
                      <div className="flex justify-between mb-2 text-xs text-gray-600">
                        <span>{team.tasks} Tasks</span>
                        <span>{team.completed || 0} Completed</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${team.efficiency}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Performance Insights */}
            {/* <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Performance Insights</h3>
              <div className="space-y-4">
                <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center mb-1 space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Tasks Status</span>
                  </div>
                  <p className="text-xs text-green-700">
                    {loading ? "Loading..." : 
                      `${chartData.totalCompleted} completed, 
                       ${chartData.totalPending} pending`}
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </>
      )}
    </div>
  )
}