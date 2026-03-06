import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import DashboardCharts from "../DashboardCharts";
import CompanyFilters from "./CompanyFilters";
import CompanyTableSection from "./CompanyTableSection";

// OverviewContent Component with User Role Support
export default function OverviewContent({
  users,
  stats,
  activeTasks,
  onViewUser,
  projectData,
  userRole,
  companyData,
  userFilterData,
  supabaseData,
}) {
  // Company filters state
  const [companyFilters, setCompanyFilters] = useState({
    typeOfWork: "",
    status: "",
    priority: "",
  });

  // Admin filters state
  const [adminFilters, setAdminFilters] = useState({
    partyName: "",
    systemName: "",
    stage: "",
  });

  const [filterMember, setFilterMember] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Filter stats based on user role
  const filteredStats = (() => {
    if (userRole === "company") {
      return stats.filter((stat) => stat.label !== "Active Tasks"); // Hide Active Tasks card for company
    } else if (userRole === "user") {
      // For individual users, show only relevant stats
      return stats.filter(
        (stat) =>
          stat.label === "Total Tasks" ||
          stat.label === "Completed" ||
          stat.label === "Pending Issues"
      );
    }
    return stats; // Show all stats for admin
  })();

  const handleCompanyFilterChange = (filterType, value) => {
    setCompanyFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearCompanyFilters = () => {
    setCompanyFilters({
      typeOfWork: "",
      status: "",
      priority: "",
    });
  };

  // Handle admin filter changes
  const handleAdminFilterChange = (filterType, value) => {
    setAdminFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearAdminFilters = () => {
    setAdminFilters({
      partyName: "",
      systemName: "",
      stage: "",
    });
  };

  // Filter project data for admin based on filters
  const filteredProjectData = projectData.filter((project) => {
    if (adminFilters.partyName && project.partyName !== adminFilters.partyName)
      return false;
    if (
      adminFilters.systemName &&
      project.systemName !== adminFilters.systemName
    )
      return false;

    // Stage filtering logic
    if (adminFilters.stage) {
      const hasStageMatch =
        (adminFilters.stage === "Active" &&
          (project.stage1 === "Active" ||
            project.stage2 === "Active" ||
            project.stage3 === "Active")) ||
        (adminFilters.stage === "Completed" &&
          project.currentStage === "Completed") ||
        (adminFilters.stage === "Pending" &&
          (project.stage1 === "Pending" ||
            project.stage2 === "Pending" ||
            project.stage3 === "Pending"));

      if (!hasStageMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Company Filters at the top - Only for Company */}
      {userRole === "company" && (
        <CompanyFilters
          companyData={companyData}
          supabaseData={supabaseData}
          filters={companyFilters}
          onFilterChange={handleCompanyFilterChange}
          onClearFilters={clearCompanyFilters}
        />
      )}

      {/* Enhanced Stats Cards */}
      {/* Enhanced Stats Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${userRole === "user"
          ? "lg:grid-cols-3"
          : userRole === "company"
            ? "lg:grid-cols-3"
            : "lg:grid-cols-4"
          } gap-6`}
      >
        {filteredStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 transition-all bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
              >
                <TrendingUp
                  className={`w-3 h-3 mr-1 ${stat.trend === "down" ? "rotate-180" : ""
                    }`}
                />
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
              {stat.loading && (
                <div className="mt-2">
                  <div className="w-16 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics - For Admin, Company, and Individual Users */}
      {(userRole === "admin" ||
        userRole === "company" ||
        userRole === "user") && (
          <DashboardCharts
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        )}

      {/* Company Table Section - Only for Company */}
      {userRole === "company" && (
        <CompanyTableSection
          companyData={companyData}
          supabaseData={supabaseData}
          filters={companyFilters}
        />
      )}

      {userRole === "admin" && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          {/* Header & Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Heading */}
              <h2 className="text-xl font-semibold text-gray-900">
                Team Overview
              </h2>

              {/* Filters */}
              <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto">
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg sm:w-auto"
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                >
                  <option value="">All Members</option>
                  {[...new Set(users.map((u) => u.name))].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg sm:w-auto"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="busy">Busy</option>
                  <option value="available">Available</option>
                </select>
              </div>
            </div>
          </div>

          {/* ------------------- Mobile Card View ------------------- */}
          <div className="p-4 space-y-4 overflow-auto lg:hidden max-h-96">
            {users && users.length > 0 ? (
              users
                .filter(
                  (user) =>
                    (filterMember ? user.name === filterMember : true) &&
                    (filterStatus ? user.status === filterStatus : true)
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl"
                  >
                    {/* Avatar + Name */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full shadow-sm bg-gradient-to-r from-blue-500 to-purple-500">
                        <span className="text-sm font-medium text-white">
                          {user.avatar}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.teamName}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Tasks:</span>{" "}
                        {user.tasksCompleted}/
                        {user.tasksAssigned + user.tasksCompleted}
                      </p>
                      <p>
                        <span className="font-medium">Assign Date:</span>{" "}
                        {user.assignDate || "No assign date"}
                      </p>
                      <p>
                        <span className="font-medium">Time Spent:</span>{" "}
                        {user.timeSpent}
                      </p>
                      <div className="flex items-center">
                        <span className="font-medium">Completion Rate:</span>
                        <div className="flex items-center ml-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{ width: `${user.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {user.completionRate}%
                          </span>
                        </div>
                      </div>
                      <p>
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${user.status === "busy"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {user.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-500">
                No team members found in sheet data
              </p>
            )}
          </div>

          {/* ------------------- Desktop Table View ------------------- */}
          <div className="hidden overflow-auto border border-gray-200 rounded-lg lg:block max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Team Member
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Team Name
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Tasks
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Last Assign Date
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Time Spent
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Completion Rate
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users
                    .filter(
                      (user) =>
                        (filterMember ? user.name === filterMember : true) &&
                        (filterStatus ? user.status === filterStatus : true)
                    )
                    .map((user) => (
                      <motion.tr
                        key={user.id}
                        className="transition-colors hover:bg-gray-50"
                        whileHover={{ backgroundColor: "#f9fafb" }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full shadow-sm bg-gradient-to-r from-blue-500 to-purple-500">
                              <span className="text-sm font-medium text-white">
                                {user.avatar}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Team Member
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.teamName}
                          </div>
                          <div className="text-xs text-gray-500">Team Name</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.tasksCompleted}/
                            {user.tasksAssigned + user.tasksCompleted}
                          </div>
                          <div className="text-xs text-gray-500">
                            Completed/Total
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.assignDate || "No assign date"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {user.timeSpent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                                style={{ width: `${user.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {user.completionRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${user.status === "busy"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                              }`}
                          >
                            {user.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No team members found in sheet data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {users && users.length === 0 && (
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="text-yellow-800">
                  No team members found. Check console for details.
                </p>
                <button
                  onClick={() => { }}
                  className="mt-2 text-sm text-yellow-600 underline"
                >
                  Log Sheet Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Stages Overview Table - Only for Admin */}
      {userRole === "admin" && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Project Stages Overview
                </h2>
                <p className="text-gray-600">
                  Track project progress through different stages
                </p>
              </div>

              {/* Right Section - Admin Filters */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <adminFilters
                  projectData={projectData}
                  filters={adminFilters}
                  onFilterChange={handleAdminFilterChange}
                  onClearFilters={clearAdminFilters}
                />
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-auto border border-gray-200 rounded-lg lg:block max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50 min-w-[300px] max-w-[400px]">
                    Description Of Work
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                    System Name
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                    Party Name
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                    Taken From
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                    Type Of Work
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                    Posted By
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase bg-gray-50">
                    Stage 1
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase bg-gray-50">
                    Stage 2
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase bg-gray-50">
                    Stage 3
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjectData && filteredProjectData.length > 0 ? (
                  filteredProjectData.map((project) => (
                    <motion.tr
                      key={project.id}
                      className="transition-colors hover:bg-gray-50"
                      whileHover={{ backgroundColor: "#f9fafb" }}
                    >
                      <td className="px-4 py-4 min-w-[300px] max-w-[400px]">
                        <div
                          className="text-sm font-medium text-gray-900 leading-relaxed break-words whitespace-normal"
                          title={project.descriptionOfWork}
                        >
                          {project.descriptionOfWork}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.systemName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.partyName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.takenFrom}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.typeOfWork}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.postedBy}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.stage1 === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : project.stage1 === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {project.stage1}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.stage2 === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : project.stage2 === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {project.stage2}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${project.stage3 === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : project.stage3 === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {project.stage3}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No project data found matching the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="overflow-auto lg:hidden max-h-96">
            {filteredProjectData && filteredProjectData.length > 0 ? (
              <div className="p-4 space-y-4">
                {filteredProjectData.map((project) => (
                  <motion.div
                    key={project.id}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    whileHover={{ backgroundColor: "#f3f4f6" }}
                  >
                    {/* Project Header */}
                    <div className="mb-3">
                      <h3
                        className="mb-1 text-sm font-medium text-gray-900 truncate"
                        title={project.descriptionOfWork}
                      >
                        {project.descriptionOfWork}
                      </h3>
                      <div
                        className="text-xs text-gray-500 truncate"
                        title={project.systemName}
                      >
                        {project.systemName}
                      </div>
                    </div>

                    {/* Project Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="min-w-0">
                        <div className="text-xs tracking-wider text-gray-500 uppercase">
                          Party Name
                        </div>
                        <div
                          className="font-medium text-gray-900 truncate"
                          title={project.partyName}
                        >
                          {project.partyName}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs tracking-wider text-gray-500 uppercase">
                          Taken From
                        </div>
                        <div
                          className="text-gray-900 truncate"
                          title={project.takenFrom}
                        >
                          {project.takenFrom}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs tracking-wider text-gray-500 uppercase">
                          Type Of Work
                        </div>
                        <div
                          className="text-gray-900 truncate"
                          title={project.typeOfWork}
                        >
                          {project.typeOfWork}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs tracking-wider text-gray-500 uppercase">
                          Posted By
                        </div>
                        <div
                          className="text-gray-900 truncate"
                          title={project.postedBy}
                        >
                          {project.postedBy}
                        </div>
                      </div>
                    </div>

                    {/* Stages Progress */}
                    <div>
                      <div className="mb-2 text-xs tracking-wider text-gray-500 uppercase">
                        Project Stages
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 text-xs text-gray-500">
                            Stage 1
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-full justify-center truncate ${project.stage1 === "Active"
                              ? "bg-blue-100 text-blue-800"
                              : project.stage1 === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                            title={project.stage1}
                          >
                            {project.stage1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 text-xs text-gray-500">
                            Stage 2
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-full justify-center truncate ${project.stage2 === "Active"
                              ? "bg-blue-100 text-blue-800"
                              : project.stage2 === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                            title={project.stage2}
                          >
                            {project.stage2}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 text-xs text-gray-500">
                            Stage 3
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full w-full justify-center truncate ${project.stage3 === "Active"
                              ? "bg-blue-100 text-blue-800"
                              : project.stage3 === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                            title={project.stage3}
                          >
                            {project.stage3}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No project data found matching the selected filters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
