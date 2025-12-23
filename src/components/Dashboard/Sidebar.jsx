"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import {
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Settings,
  Activity,
  Code,
  Building2,
  User,
  Shield,
  Bot, // Add this import
  Sparkles // Add this import
} from "lucide-react"

const Sidebar = ({ activeTab, setActiveTab, onClose, isMobile }) => {
  const [userPermissions, setUserPermissions] = useState([])
  const [userInfo, setUserInfo] = useState(null)

  // Function to get dynamic tab label based on user role
  const getTabLabel = (tabId, userRole) => {
    if (tabId === "assign-task" && userRole === "company") {
      return "Generated Ticket"
    }

    // Default labels for all other cases
    const defaultLabels = {
      "overview": "Dashboard",
      "assign-task": "Assign Task",
      "tasks-table": "Tasks Table",
      "developer-stage": "Developer Stage",
      "pending-tasks": "Pending Tasks",
      "completed-tasks": "Completed Tasks",
      "troubleshoot": "Troubleshoot",
      "systems": "All Systems List",
      "ai-helper": "AI System Consultant", // Add this
      "reports": "Reports"
    }

    return defaultLabels[tabId] || "Unknown"
  }

  // All available tabs with their identifiers (labels will be dynamic)
  const getAllTabs = (userRole) => [
    { id: "overview", label: getTabLabel("overview", userRole), icon: BarChart3, key: "dashboard" },
    { id: "assign-task", label: getTabLabel("assign-task", userRole), icon: Plus, key: "assign-task" },
    { id: "tasks-table", label: getTabLabel("tasks-table", userRole), icon: FileText, key: "tasks-table" },
    { id: "developer-stage", label: getTabLabel("developer-stage", userRole), icon: Code, key: "developer-stage" },
    { id: "pending-tasks", label: getTabLabel("pending-tasks", userRole), icon: Clock, key: "pending-tasks" },
    { id: "completed-tasks", label: getTabLabel("completed-tasks", userRole), icon: CheckCircle, key: "completed-tasks" },
    { id: "systems", label: getTabLabel("systems", userRole), icon: Activity, key: "systems" },
    { id: "troubleshoot", label: getTabLabel("troubleshoot", userRole), icon: Settings, key: "troubleshoot" },
    { id: "ai-helper", label: getTabLabel("ai-helper", userRole), icon: Bot, key: "ai-helper" }, // Add this
    {id: "reports", label: getTabLabel("reports", userRole), icon: BarChart3, key: "reports" }
  ]

  useEffect(() => {
    // Get user data from different sources
    let userData = null;

    // Try sessionStorage first
    const storedSession = sessionStorage.getItem('userSession')
    if (storedSession) {
      try {
        userData = JSON.parse(storedSession)
        // console.log("🔍 Found session data:", userData)
      } catch (e) {
        console.error("❌ Error parsing session data:", e)
      }
    }

    // Try localStorage as backup
    if (!userData) {
      const storedUsername = localStorage.getItem('tempUsername')
      if (storedUsername) {
        // Try to get user data from localStorage values
        userData = {
          username: storedUsername,
          // We need to reconstruct user data - this is a fallback
        }
      }
    }

    // console.log("📋 Final user data:", userData)
    setUserInfo(userData)

    if (userData) {
      // Handle different user types
      if (userData.role === "admin" || userData.type === "admin") {
        // console.log("👑 User is admin - showing all tabs")
        setUserPermissions(["all"])
      } else if (userData.role === "company") {
        // console.log("🏢 User is company - using paginationnew")
        handleCompanyPermissions(userData)
      } else if (userData.role === "user" || userData.type === "user") {
        // console.log("👤 User is regular user - using pagination")
        handleUserPermissions(userData)
      } else {
        // console.log("⚠️ Unknown user type - showing default")
        setUserPermissions(["dashboard"])
      }
    } else {
      // console.log("❌ No user data found - showing default")
      setUserPermissions(["dashboard"])
    }
  }, [])

  // Handle company permissions using paginationnew from Column E
const handleCompanyPermissions = (userData) => {
  // console.log("🔧 Processing company permissions...")

  const paginationNew = userData.companyData?.paginationNew;
  const pagination = userData.pagination;

  if (paginationNew) {
    // console.log("📄 Company paginationNew:", paginationNew);

    if (typeof paginationNew === "string") {
      if (paginationNew.toLowerCase() === "all") {
        // console.log("✅ Company has access to all pages");
        setUserPermissions(["all"]);
      } else {
        const permissions = paginationNew
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        // console.log("🔑 Company parsed permissions (string):", permissions);
        setUserPermissions(permissions);
      }
    } else if (Array.isArray(paginationNew)) {
      const permissions = paginationNew.map(perm => perm.toLowerCase());
      // console.log("🔑 Company parsed permissions (array):", permissions);
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected paginationNew format:", paginationNew);
      setUserPermissions(["dashboard"]);
    }
  } else if (pagination) {
    // console.log("⚠️ Using fallback pagination for company:", pagination);

    if (typeof pagination === "string") {
      if (pagination.toLowerCase() === "all") {
        setUserPermissions(["all"]);
      } else {
        const permissions = pagination
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        // console.log("🔑 Company fallback permissions (string):", permissions);
        setUserPermissions(permissions);
      }
    } else if (Array.isArray(pagination)) {
      const permissions = pagination.map(perm => perm.toLowerCase());
      // console.log("🔑 Company fallback permissions (array):", permissions);
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected pagination format:", pagination);
      setUserPermissions(["dashboard"]);
    }
  } else {
    // console.log("❌ No pagination data found for company - showing dashboard only");
    setUserPermissions(["dashboard"]);
  }
};


  // Handle user permissions using existing pagination logic
 const handleUserPermissions = (userData) => {
  // console.log("🔧 Processing user permissions...")

  const pagination = userData.pagination;

  if (pagination) {
    // console.log("📄 User pagination:", pagination);

    if (typeof pagination === "string") {
      // case: string like "all" or "pending-tasks,completed-tasks"
      if (pagination.toLowerCase() === "all") {
        // console.log("✅ User has access to all pages");
        setUserPermissions(["all"]);
      } else {
        const permissions = pagination
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        // console.log("🔑 User parsed permissions:", permissions);
        setUserPermissions(permissions);
      }
    } else if (Array.isArray(pagination)) {
      // case: already an array
      const permissions = pagination.map(perm => perm.toLowerCase());
      // console.log("🔑 User array permissions:", permissions);
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected pagination format:", pagination);
      setUserPermissions(["dashboard"]);
    }
  } else {
    // console.log("❌ No pagination found for user - showing default");
    setUserPermissions(["dashboard"]);
  }
};


  // Filter tabs based on permissions
  const getVisibleTabs = () => {
    const allTabs = getAllTabs(userInfo?.role) // Get tabs with dynamic labels

    if (userPermissions.includes("all")) {
      // console.log("🌟 Showing all tabs")
      return allTabs
    }

    const visibleTabs = allTabs.filter(tab => {
      // Always show dashboard
      if (tab.id === "overview" || tab.key === "dashboard") {
        return true
      }

      // Always show AI Helper for company and admin (even if not in permissions)
      if (tab.id === "ai-helper" && (userInfo?.role === "company" || userInfo?.role === "admin")) {
        return true
      }

      // Check if user has permission
      return userPermissions.some(permission => {
        const permLower = permission.toLowerCase().replace(/[-_\s]/g, '')
        const tabKeyLower = tab.key.toLowerCase().replace(/[-_\s]/g, '')
        const tabIdLower = tab.id.toLowerCase().replace(/[-_\s]/g, '')

        const hasPermission = permLower === tabKeyLower ||
          permLower === tabIdLower ||
          permLower.includes(tabKeyLower) ||
          tabKeyLower.includes(permLower)

        if (hasPermission) {
          // console.log(`✅ Permission "${permission}" matches tab "${tab.label}"`)
        }

        return hasPermission
      })
    })

    // console.log("👁️ Visible tabs:", visibleTabs.map(t => t.label))
    return visibleTabs.length > 0 ? visibleTabs : [allTabs[0]] // At least show dashboard
  }

  const visibleTabs = getVisibleTabs()

  // Get user role icon
  const getUserRoleIcon = () => {
    if (!userInfo) return User

    switch (userInfo.role) {
      case "admin":
        return Shield
      case "company":
        return Building2
      case "user":
      default:
        return User
    }
  }

  // Get user role color
  const getUserRoleColor = () => {
    if (!userInfo) return "text-gray-500"

    switch (userInfo.role) {
      case "admin":
        return "text-red-500"
      case "company":
        return "text-blue-500"
      case "user":
      default:
        return "text-green-500"
    }
  }

  const RoleIcon = getUserRoleIcon()

  return (
    <aside className="w-72 bg-white border-r border-gray-200 min-h-screen shadow-sm">
      <nav className="p-4">
        {/* User Info Section */}
       {/* User Info Section */}
        {userInfo && (
          <div className="mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm ${getUserRoleColor()}`}>
                <RoleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {userInfo.role === "company" && userInfo.companyData?.companyName 
                    ? userInfo.companyData.companyName 
                    : userInfo.username || "Unknown User"
                  }
                </p>
                <p className={`text-xs font-medium capitalize ${getUserRoleColor()}`}>
                  {userInfo.role || "user"}
                </p>
              </div>
            </div>

            {/* Permission Summary */}
            <div className="mt-2 text-xs text-gray-600">
              {userPermissions.includes("all") ? (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                  Full Access
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                  {visibleTabs.length} Page{visibleTabs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="space-y-2">
          {visibleTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => {
                // console.log("🖱️ Tab clicked:", tab.label)
                setActiveTab(tab.id);
                if (isMobile && onClose) {
                  onClose();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                  : "text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
              
              {/* Special badge for AI Helper */}
              {tab.id === "ai-helper" && (
                <span className="ml-auto">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar