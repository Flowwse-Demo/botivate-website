"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  TrendingUp,
  Target,
  Activity,
  X,
  Code,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import Button from "../../ui/Button";
import AssignTaskForm from "../AssignTaskForm";
import TaskList from "../TaskList";
import TroubleShootPage from "../TroubleShootPage";
import SystemsList from "../SystemsList";
import TasksTable from "../TaskTable";
import DashboardCharts from "../DashboardCharts";
import DeveloperStagePage from "../DeveloperStagePage";
import AiHelperPage from "../AiHelper"; // Adjust the path if needed
import ReportsPage from "../Report";
import supabase from "../../../supabaseClient";
import OverviewContent from "./OverviewContent";
import {
  fetchSupabaseData,
  determineUserRole,
  processTeamDataFromSupabase,
} from "./helpers";

// Main AdminDashboard Component
export default function AdminDashboard({
  onLogout,
  username,
  pagination,
  activeTab,
  setActiveTab,
  user,
  userFilterData,
  companyData,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalTab, setUserModalTab] = useState("pending");
  const [supabaseData, setSupabaseData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTask, setTotalTask] = useState(0);
  const [pendingTask, setPendingTask] = useState(0);
  const [completeTask, setCompleteTask] = useState(0);

  const userRole = determineUserRole(username, userFilterData, companyData);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const data = await fetchSupabaseData();
        setSupabaseData(data);

        // 🔥 CHANGED: Now awaiting the async function
        const processedTeamMembers = await processTeamDataFromSupabase(
          data,
          userRole
        );
        setTeamMembers(processedTeamMembers);

        await fetchTaskCounts();
      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, companyData, userFilterData]);

  // Fetch task counts from Supabase - OPTIMIZED VERSION
  const fetchTaskCounts = async () => {
    try {


      // Build base query
      let baseQuery = supabase
        .from("FMS")
        .select("*", { count: "exact", head: true });

      if (userRole === "company" && companyData?.companyName) {
        baseQuery = baseQuery.eq("party_name", companyData.companyName);
      } else if (userRole === "user" && userFilterData?.username) {
        // Filter by BOTH team_member_name OR employee_name_1
        baseQuery = baseQuery.or(
          `team_member_name.eq.${userFilterData.username},employee_name_1.eq.${userFilterData.username}`
        );
      }

      // Total tasks
      const { count: totalCount, error: totalError } = await baseQuery;
      if (totalError) throw totalError;
      setTotalTask(totalCount || 0);


      // Pending tasks (tasks that are not fully completed yet, i.e., actual3 is null or missing completion criteria)
      let pendingQuery = supabase
        .from("FMS")
        .select("*", { count: "exact", head: true })
        .is("actual3", null); // actual3 NULL means it is not finished.

      if (userRole === "admin") {
        // Admins see all pending tasks
      } else if (userRole === "company" && companyData?.companyName) {
        pendingQuery = pendingQuery.eq("party_name", companyData.companyName);
      } else if (userRole === "user" && userFilterData?.username) {
        pendingQuery = pendingQuery.or(
          `team_member_name.eq.${userFilterData.username},employee_name_1.eq.${userFilterData.username}`
        );
      }

      const { count: pendingCount, error: pendingError } = await pendingQuery;
      if (pendingError) throw pendingError;
      setPendingTask(pendingCount || 0);


      // Completed tasks (actual3 is not null)
      let completeQuery = supabase
        .from("FMS")
        .select("*", { count: "exact", head: true })
        .not("actual3", "is", null);

      if (userRole === "company" && companyData?.companyName) {
        completeQuery = completeQuery.eq("party_name", companyData.companyName);
      } else if (userRole === "user" && userFilterData?.username) {
        completeQuery = completeQuery.or(
          `team_member_name.eq.${userFilterData.username},employee_name_1.eq.${userFilterData.username}`
        );
      }

      const { count: completeCount, error: completeError } = await completeQuery;
      if (completeError) throw completeError;
      setCompleteTask(completeCount || 0);


    } catch (error) {
      console.error("Error fetching task counts:", error);
    }
  };

  // Create stats array with actual data
  const stats = [
    {
      label: "Total Tasks",
      value: loading ? "..." : totalTask.toString(),
      icon: Users,
      color: "from-blue-500 to-blue-600",
      // change: "+2 this month",
      trend: "up",
      loading: loading,
    },
    {
      label: "Active Tasks",
      value: loading ? "..." : pendingTask.toString(),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      // change: "+5 today",
      trend: "up",
      loading: loading,
    },
    {
      label: "Completed",
      value: loading ? "..." : completeTask.toString(),
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      // change: "+12% vs yesterday",
      trend: "up",
      loading: loading,
    },
    {
      label: "Pending Issues",
      value: loading ? "..." : pendingTask.toString(),
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      // change: "-2 resolved",
      trend: "down",
      loading: loading,
    },
  ];

  const handleTaskCreated = (newTasks) => {
    setTasks((prev) => [...prev, ...newTasks]);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setUserModalTab("pending");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewContent
            users={teamMembers}
            stats={stats}
            activeTasks={[]}
            onViewUser={handleViewUser}
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        );
      case "assign-task": {
        return <AssignTaskForm onTaskCreated={handleTaskCreated} userRole={userRole} />;
      }
      case "tasks-table":
        return <TasksTable tasks={tasks} />;
      case "developer-stage":
        return <DeveloperStagePage />;
      case "pending-tasks":
        return (
          <TaskList
            type="pending"
            userFilterData={userFilterData}
            companyData={companyData}
            supabaseData={supabaseData}
          />
        );
      case "completed-tasks":
        return (
          <TaskList
            type="completed"
            userFilterData={userFilterData}
            companyData={companyData}
            supabaseData={supabaseData}
          />
        );
      case "troubleshoot":
        return <TroubleShootPage />;
      case "systems":
        return (
          <SystemsList
            userRole={userRole}
            companyData={companyData}
            supabaseData={supabaseData}
          />
        );
      case "ai-helper":
        return <AiHelperPage />;
      case "reports":
        return (
          <ReportsPage
            userRole={userRole}
          />
        );
      default:
        return (
          <OverviewContent
            users={teamMembers}
            stats={stats}
            activeTasks={[]}
            onViewUser={handleViewUser}
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {loading && (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <span className="text-sm text-blue-800">Loading data...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="overflow-auto">{renderContent()}</main>

      {/* User Tasks Modal - Only for admin */}
      {showUserModal && selectedUser && userRole === "admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 text-white bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full bg-opacity-20">
                    <span className="text-lg font-bold text-white">
                      {selectedUser.avatar}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedUser.name}'s Tasks
                    </h2>
                    <p className="text-blue-100">
                      {selectedUser.tasksCompleted}/
                      {selectedUser.totalTasksGiven} tasks completed •{" "}
                      {selectedUser.completionRate}% completion rate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setUserModalTab("inprogress")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${userModalTab === "inprogress"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>In Progress</span>
                    <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                      {selectedUser.inProgressTasks || 0}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setUserModalTab("completed")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${userModalTab === "completed"
                    ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed Tasks</span>
                    <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                      {selectedUser.tasksCompleted || 0}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {userModalTab === "pending" && (
                <div className="space-y-4">
                  <div className="py-8 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      Pending tasks data will be loaded from sheet in future
                      update
                    </p>
                  </div>
                </div>
              )}
              {userModalTab === "completed" && (
                <div className="space-y-4">
                  <div className="py-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      Completed tasks data will be loaded from sheet in future
                      update
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
