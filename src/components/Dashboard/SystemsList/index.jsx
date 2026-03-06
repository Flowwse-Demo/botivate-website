"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Server,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader
} from "lucide-react"

import Button from "../../ui/Button"
import { getStatusColor } from "../../../utils/statusHelpers"
import SystemDetailsModal from "./SystemDetailsModal"
import { useCalculateTotalUpdate, useTotalUpdate } from "./hooks"
import { dataCache, isQuickCacheValid, fetchSupabaseDataCached } from "./cache"
import { processSystemsData } from "./dataProcessing"

export default function SystemsList({ userRole: propUserRole, companyData }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [sortField, setSortField] = useState("systemName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [systems, setSystems] = useState([])
 
  const [companyName, setCompanyName] = useState(companyData?.companyName || "")
  const [userRole, setUserRole] = useState(propUserRole || "company")
  const [activeTab, setActiveTab] = useState("inprogress")
  const [fmsData, setFmsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingData, setPendingData] = useState([])
  const [completeData, setCompleteData] = useState([])

  const { getTotalUpdate, getUpdateData } = useCalculateTotalUpdate(completeData);

  useEffect(() => {
    const fetchFmsData = async (filter = "all") => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await fetchSupabaseDataCached("FMS")
        if (error) throw error

        const pending = []
        const complete = []

        data.forEach(row => {
          if (row.actual3) { 
            complete.push({ ...row, status: "Completed" }) 
          } else { 
            pending.push({ ...row, status: "Pending" }) 
          } 
        })

        setPendingData(pending)
        setCompleteData(complete)
        setFmsData(data)
      } catch (err) {
        setError(err.message)
        console.error("Error fetching FMS data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFmsData("all")
  }, [])

  useEffect(() => {
    if (propUserRole) {
      setUserRole(propUserRole)
    }
    if (companyData?.companyName) {
      setCompanyName(companyData.companyName)
    }
  }, [propUserRole, companyData])

  useEffect(() => {
    if (!propUserRole && !companyData) {
      setUserRole("company")
      setCompanyName("")
    }
  }, [])

  const fetchSystemsData = useCallback(async () => {
    if (isQuickCacheValid() && dataCache.quickCache.systems) {
      setSystems(dataCache.quickCache.systems)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [systemData] = await Promise.all([
        fetchSupabaseDataCached("FMS")
      ])
      
      const processedSystems = processSystemsData(systemData, userRole, companyName)

      dataCache.quickCache = {
        systems: processedSystems,
        lastCached: Date.now()
      }

      setSystems(processedSystems)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching systems data:', err)
    } finally {
      setLoading(false)
    }
  }, [userRole, companyName])

  useEffect(() => {
    fetchSystemsData()
    const interval = setInterval(fetchSystemsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSystemsData])

  const completedDataForTable = completeData.filter(
    row => (row.type_of_work || "").toLowerCase() === "new system"
  )

  const filteredPending = userRole === "company"
    ? pendingData.filter(row => row.party_name === companyData?.companyName)
    : pendingData

  const filteredCompleted = userRole === "company"
    ? completedDataForTable.filter(row => row.party_name === companyData?.companyName)
    : completedDataForTable

  const currentSystems = activeTab === "inprogress"
    ? filteredPending
    : filteredCompleted

  const sortedSystems = useMemo(() => {
    return [...currentSystems].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (sortField === "lastUpdate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [currentSystems, sortField, sortDirection]);

  const { filteredSystems, uniqueTypes, uniqueStatuses } = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()

    const filtered = currentSystems.filter((system) => {
      const matchesSearch = !searchTerm || (
        system.system_name?.toLowerCase().includes(searchLower) ||
        system.description_of_work?.toLowerCase().includes(searchLower) ||
        system.party_name?.toLowerCase().includes(searchLower) ||
        system.type_of_work?.toLowerCase().includes(searchLower)
      )

      const matchesType = !filterType || system.type_of_work === filterType
      const matchesStatusFilter = !filterStatus || system.status === filterStatus

      return matchesSearch && matchesType && matchesStatusFilter
    })

    const types = [...new Set(filtered.map(s => s.type_of_work).filter(Boolean))]
    const statuses = [...new Set(filtered.map(s => s.status).filter(Boolean))]

    return {
      filteredSystems: filtered,
      uniqueTypes: types,
      uniqueStatuses: statuses
    }
  }, [currentSystems, searchTerm, filterType, filterStatus, activeTab])

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField, sortDirection])

  const handleViewSystem = useCallback((system) => {
    const totalUpdates = getTotalUpdate(system);
    const updateData = getUpdateData(system);
    
    setSelectedSystem({ 
      ...system, 
      totalUpdates,
      updateData 
    });
    setShowSystemModal(true);
  }, [getTotalUpdate, getUpdateData]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "inprogress":
      case "in progress":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "completed":
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "maintenance":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "development":
        return <Server className="w-4 h-4 text-blue-500" />
      case "inactive":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Server className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600 text-sm">Loading systems data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-red-800 font-medium">Error Loading Data</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button
          onClick={fetchSystemsData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Systems List</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and monitor all your systems {userRole === "admin" ? "(Admin View)" : `for ${companyName}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500">In Progress</div>
              <div className="text-lg font-semibold text-yellow-600">{pendingData.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-lg font-semibold text-green-600">{completeData.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-semibold text-blue-600">{fmsData.length}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="">All Type of work</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Single Table with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inprogress')}
              className={`flex-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-r border-gray-200 ${activeTab === 'inprogress'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">In Progress</span>
                </div>
                <span className="sm:hidden text-xs text-center">In Progress</span>
                <span className="bg-yellow-100 text-yellow-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                  {filteredPending.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'completed'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Completed</span>
                </div>
                <span className="sm:hidden text-xs text-center">Completed</span>
                <span className="bg-green-100 text-green-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                  {filteredCompleted.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
       <div className="hidden sm:block overflow-x-auto relative" style={{ maxHeight: '70vh' }}>
  <table className="min-w-full divide-y divide-gray-200">
   <thead className="bg-gray-50 sticky top-0 z-10">
  <tr>
    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
      S.No.
    </th>

    {/* Actions column only in Completed */}
    {activeTab === "completed" && (
      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
        Actions
      </th>
    )}

    {(userRole === "admin" || userRole === "company") && (
      <th
        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-48"
        onClick={() => handleSort("systemName")}
      >
        <div className="flex items-center space-x-1">
          <span>System Name</span>
          {sortField === "systemName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
        </div>
      </th>
    )}

    {userRole === "admin" && (
      <th
        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-40"
        onClick={() => handleSort("partyName")}
      >
        <div className="flex items-center space-x-1">
          <span>Party Name</span>
          {sortField === "partyName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
        </div>
      </th>
    )}

    <th
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-40"
      onClick={() => handleSort("departmentName")}
    >
      <div className="flex items-center space-x-1">
        <span>Department Name</span>
        {sortField === "departmentName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </div>
    </th>

    <th
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-36"
      onClick={() => handleSort("typeOfSystem")}
    >
      <div className="flex items-center space-x-1">
        <span>Type of System</span>
        {sortField === "typeOfSystem" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </div>
    </th>

    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
      Status
    </th>

    {/* Total Updation only in Completed */}
    {activeTab === "completed" && (
      <th
        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
        onClick={() => handleSort("totalUpdation")}
      >
        <div className="flex items-center space-x-1">
          <span>Total Updation</span>
          {sortField === "totalUpdation" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
        </div>
      </th>
    )}
  </tr>
</thead>

    <tbody className="bg-white divide-y divide-gray-200">
      {sortedSystems.length === 0 ? (
        <tr>
          <td colSpan={userRole === "admin" ? "9" : "8"} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center space-y-2">
              {activeTab === 'inprogress' ? (
                <Clock className="w-12 h-12 text-gray-400" />
              ) : (
                <CheckCircle className="w-12 h-12 text-gray-400" />
              )}
              <h3 className="text-gray-900 font-medium text-base">
                No {activeTab === 'inprogress' ? 'in progress' : activeTab} systems found
              </h3>
              <p className="text-gray-500 text-sm">No systems match your current filters.</p>
            </div>
          </td>
        </tr>
      ) : (
        filteredSystems.map((system, index) => (
          <motion.tr
            key={system.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="hover:bg-gray-50"
          >
            <td className="px-3 py-4 w-16">
              <div className="text-sm font-medium text-gray-900">{index + 1}</div>
            </td>
        {activeTab === "completed" && (
  <td className="px-3 py-4 w-24">
    <div className="flex items-center">
      <Button
        onClick={() => handleViewSystem(system)}
        variant="outline"
        className="flex items-center bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
      >
        <span>View</span>
      </Button>
    </div>
  </td>
)}
            {(userRole === "admin" || userRole === "company") && (
              <td className="px-3 py-4 w-48">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 mt-1">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Server className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 break-words leading-relaxed" title={system.system_name}>
                      {system.system_name}
                    </div>
                    <div className="text-xs text-gray-500 break-words">{system.developer || 'System Admin'}</div>
                  </div>
                </div>
              </td>
            )}
            {userRole === "admin" && (
              <td className="px-3 py-4 w-40">
                <div className="text-sm text-gray-900 break-words" title={system.party_name}>
                  <div className="line-clamp-2">
                    {system.party_name}
                  </div>
                </div>
              </td>
            )}
            <td className="px-3 py-4 w-40">
              <div className="text-sm text-gray-900 break-words leading-relaxed" title={system.description_of_work}>
                {system.description_of_work}
              </div>
            </td>
            <td className="px-3 py-4 w-36">
              <div className="text-sm text-gray-900 break-words" title={system.type_of_work}>
                <div className="line-clamp-2">
                  {system.type_of_work}
                </div>
              </div>
            </td>
            <td className="px-3 py-4 w-28">
              <div className="flex items-center">
                {getStatusIcon(system.status)}
                <span
                  className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
                >
                  {system.status || 'In Progress'}
                </span>
              </div>
            </td>
         {activeTab === "completed" && (
  <td className="px-3 py-4 w-32">
    <div className="text-sm text-gray-900">
      {getTotalUpdate(system)}
    </div>
  </td>
)}
          </motion.tr>
        ))
      )}
    </tbody>
  </table>
</div>

        <style jsx>{`
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    max-height: calc(2 * 1.4em);
  }
`}</style>

      {/* Mobile Card View */}
<div className="sm:hidden" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
  {sortedSystems.length === 0 ? (
    <div className="px-4 py-12 text-center">
      <div className="flex flex-col items-center space-y-2">
        {activeTab === 'inprogress' ? (
          <Clock className="w-8 h-8 text-gray-400" />
        ) : (
          <CheckCircle className="w-8 h-8 text-gray-400" />
        )}
        <h3 className="text-gray-900 font-medium text-sm">
          No {activeTab === 'inprogress' ? 'in progress' : activeTab} systems found
        </h3>
        <p className="text-gray-500 text-xs">No systems match your current filters.</p>
      </div>
    </div>
  ) : (
    <div className="space-y-3 p-3">
      {filteredSystems.map((system, index) => (
        <motion.div
          key={system.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Header with S.No and Status */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                #{system.sno}
              </span>
              <div className="flex items-center">
                {getStatusIcon(system.status)}
                <span
                  className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
                >
                  {system.status || 'Progress'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Updates</div>
              <div className="text-sm font-semibold text-gray-900">{system.total_updation}</div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-2 mb-3">
            {userRole === "admin" && (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Server className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 text-sm">{system.system_name}</h4>
                  <p className="text-xs text-gray-500">{system.developer || 'System Admin'}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Party:</span> {system.party_name}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Department:</span> {system.description_of_work}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Type:</span>
                <span className="text-green-600 font-medium ml-1">{system.type_of_work}</span>
              </p>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Flowchart:</span> {system.flowchart}
              </p>
            </div>
            <Button
              onClick={() => handleViewSystem(system)}
              variant="outline"
              className="flex items-center space-x-1 bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs"
            >
              <span>View</span>
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )}
</div>
      </div>

      {/* System Details Modal */}
      {showSystemModal && selectedSystem && (
        <SystemDetailsModal
          system={selectedSystem}
          onClose={() => {
            setShowSystemModal(false)
            setSelectedSystem(null)
          }}
        />
      )}
    </div>
  )
}
