// OverviewContent Component with User Role Support
function OverviewContent({
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
                  onClick={() => console.log("Sheet data:", sheetData)}
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
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTask, setTotalTask] = useState(0);
  const [pendingTask, setPendingTask] = useState(0);
  const [completeTask, setCompleteTask] = useState(0);

  const userRole = determineUserRole(username, userFilterData, companyData);


  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);

  //     try {
  //       // Fetch FMS data from Supabase
  //       const data = await fetchSupabaseData();
  //       setSupabaseData(data);

  //       // Process team data
  //       const processedTeamMembers = processTeamDataFromSupabase(
  //         data,
  //         userRole
  //       );
  //       setTeamMembers(processedTeamMembers);

  //       // Process project data
  //       const processedProjectData = processProjectData(data, userRole);
  //       setProjectData(processedProjectData);

  //       // Calculate task counts
  //       await fetchTaskCounts();
  //     } catch (error) {
  //       console.error("Error fetching data from Supabase:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [userRole, companyData, userFilterData]);


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

      const processedProjectData = processProjectData(data, userRole);
      setProjectData(processedProjectData);

      await fetchTaskCounts();
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [userRole, companyData, userFilterData]);

  //  const fetchTaskCounts = async () => {
  //     try {
  //       // Build base query
  //       let baseQuery = supabase.from("FMS").select("*", { count: "exact", head: true });

  //       if (userRole === "company" && companyData?.companyName) {
  //         baseQuery = baseQuery.eq("party_name", companyData.companyName);
  //       } else if (userRole === "user" && userFilterData?.username) {
  //         baseQuery = baseQuery.eq("employee_name_1", userFilterData.username);
  //       }

  //       // Total tasks
  //       const { count: totalCount, error: totalError } = await baseQuery;
  //       if (totalError) throw totalError;
  //       setTotalTask(totalCount || 0);

  //       // Pending tasks (actual3 is null)
  //       let pendingQuery = supabase.from("FMS").select("*", { count: "exact", head: true }).is("actual3", null);
  //       if (userRole === "company" && companyData?.companyName) {
  //         pendingQuery = pendingQuery.eq("party_name", companyData.companyName);
  //       } else if (userRole === "user" && userFilterData?.username) {
  //         pendingQuery = pendingQuery.eq("employee_name_1", userFilterData.username);
  //       }
  //       const { count: pendingCount, error: pendingError } = await pendingQuery;
  //       if (pendingError) throw pendingError;
  //       setPendingTask(pendingCount || 0);

  //       // Completed tasks (actual3 is not null)
  //       let completeQuery = supabase.from("FMS").select("*", { count: "exact", head: true }).not("actual3", "is", null);
  //       if (userRole === "company" && companyData?.companyName) {
  //         completeQuery = completeQuery.eq("party_name", companyData.companyName);
  //       } else if (userRole === "user" && userFilterData?.username) {
  //         completeQuery = completeQuery.eq("employee_name_1", userFilterData.username);
  //       }
  //       const { count: completeCount, error: completeError } = await completeQuery;
  //       if (completeError) throw completeError;
  //       setCompleteTask(completeCount || 0);

  //     } catch (error) {
  //       console.error("Error fetching task counts:", error);
  //     }
  //   };

  // ENHANCED: User role determination with proper user filtering

  // Fetch sheet data on component mount
  // useEffect(() => {
  //   const loadSheetData = async () => {
  //     setLoading(true);
  //     try {
  //       // console.log("Starting data load for Team Overview...");
  //       const data = await fetchSheetData();
  //       // console.log("Fetched sheet data:", data);

  //       if (data && data.length > 0) {

  //         setSheetData(data);

  //         const processedTeamMembers = processTeamData(data, userRole);
  //         const processedProjectData=processProjectData(data,userRole);
  //         // console.log("Processed team members:", processedTeamMembers);
  //         setTeamMembers(processedTeamMembers);
  //         setProjectData(processedProjectData);
  //       } else {
  //         console.warn("No rows returned from FMS table");
  //       }
  //     } catch (error) {
  //       console.error("Error loading sheet data:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadSheetData();
  // }, [userRole]);

  // Fetch task counts from Supabase
  // Fetch task counts from Supabase - OPTIMIZED VERSION
  const fetchTaskCounts = async () => {
    try {
      console.log("Fetching tasks for:", { userRole, username: userFilterData?.username });

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
      console.log("Total tasks:", totalCount);

      // Pending tasks (actual3 is null)
      let pendingQuery = supabase
        .from("FMS")
        .select("*", { count: "exact", head: true })
        .not("planned3", "is", null)  // planned3 NOT NULL
        .is("actual3", null);         // actual3 NULL

      if (userRole === "company" && companyData?.companyName) {
        pendingQuery = pendingQuery.eq("party_name", companyData.companyName);
      } else if (userRole === "user" && userFilterData?.username) {
        pendingQuery = pendingQuery.or(
          `team_member_name.eq.${userFilterData.username},employee_name_1.eq.${userFilterData.username}`
        );
      }

      const { count: pendingCount, error: pendingError } = await pendingQuery;
      if (pendingError) throw pendingError;
      setPendingTask(pendingCount || 0);
      console.log("Pending tasks:", pendingCount);

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
      console.log("Completed tasks:", completeCount);

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
            projectData={projectData}
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        );
      case "assign-task": {
        // console.log('Assign Task - Using userRole:', userRole)
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
            projectData={projectData}
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
("use client");

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
import Button from "../ui/Button";
import AssignTaskForm from "./AssignTaskForm";
import TaskList from "./TaskList";
import TroubleShootPage from "./TroubleShootPage";
import SystemsList from "./SystemsList";
import TasksTable from "./TaskTable";
import DashboardCharts from "./DashboardCharts";
import DeveloperStagePage from "./DeveloperStagePage";
import AiHelperPage from "./AiHelper"; // Adjust the path if needed
import ReportsPage from "./report.jsx"
import supabase from "../../supabaseClient";

// Fetch data from Supabase
const fetchSupabaseData = async () => {
  try {
    // Query all rows from FMS table
    const { data, error } = await supabase.from("FMS").select("*");

    if (error) throw error;

    // Ensure array response
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching Supabase FMS data:", error);
    return [];
  }
};

// Enhanced user role determination (unchanged)
const determineUserRole = (username, userFilterData, companyData) => {
  // console.log('Enhanced Role Determination:');
  // console.log('  - username:', username);
  // console.log('  - userFilterData:', userFilterData);
  // console.log('  - companyData:', companyData);

  // Method 1: Check if username is admin (highest priority)
  if (username === "admin") {
    // console.log('  Admin detected via username');
    return "admin";
  }

  // Method 2: Check userFilterData.isAdmin
  if (userFilterData?.isAdmin === true) {
    // console.log('  Admin detected via userFilterData.isAdmin');
    return "admin";
  }

  // Method 3: Check for company data (company login)
  if (companyData && companyData.companyName && !userFilterData?.username) {
    // console.log('  Company detected via companyData');
    return "company";
  }

  // Method 4: Check if user has individual user data (individual user login)
  if (
    userFilterData &&
    (userFilterData.username ||
      userFilterData.name ||
      userFilterData.memberName)
  ) {
    // console.log('  Individual user detected via userFilterData');
    return "user";
  }

  // Method 5: Check session storage for role
  if (typeof window !== "undefined") {
    try {
      const session = sessionStorage.getItem("userSession");
      if (session) {
        const userData = JSON.parse(session);
        if (userData.role === "admin") {
          // console.log('  Admin detected via session storage');
          return "admin";
        }
        if (userData.role === "company") {
          // console.log('  Company detected via session storage');
          return "company";
        }
        if (userData.role === "user") {
          // console.log('  User detected via session storage');
          return "user";
        }
      }
    } catch (error) {
      // console.log('  Error reading session storage:', error);
    }
  }

  // Default to user if we have user data, otherwise admin
  const defaultRole = userFilterData ? "user" : "admin";
  // console.log('  Defaulting to role:', defaultRole);
  return defaultRole;
};

// Calculate stats from Supabase data
const calculateStatsFromSupabase = (
  supabaseData,
  userRole = "admin",
  companyData = null,
  userFilterData = null
) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return {
      totalTasks: 0,
      activeTasks: 0,
      completedToday: 0,
      pendingIssues: 0,
    };
  }

  // console.log('Starting data filtering for role:', userRole);
  // console.log('Total rows before filtering:', supabaseData.length);

  let filteredData = [...supabaseData];

  // Filter data based on user role
  if (userRole === "company" && companyData && companyData.companyName) {
    // console.log('Filtering data for company:', companyData.companyName);

    filteredData = filteredData.filter(
      (item) =>
        item.party_name &&
        item.party_name.toLowerCase() === companyData.companyName.toLowerCase()
    );

    // console.log(`After company filtering: ${filteredData.length} tasks found`);
  } else if (userRole === "user" && userFilterData) {
    // console.log('Filtering data for user:', userFilterData);

    let userName = null;
    if (userFilterData.username) {
      userName = userFilterData.username;
    } else if (userFilterData.name) {
      userName = userFilterData.name;
    } else if (userFilterData.memberName) {
      userName = userFilterData.memberName;
    }

    // console.log('Final username for filtering:', userName);

    if (userName && userName !== "undefined" && userName !== "Unknown User") {
      filteredData = filteredData.filter((item) => {
        const employeeName1 = item.team_member_name
          ? item.team_member_name.toString().trim().toLowerCase()
          : "";
        const employeeName2 = item.employee_name_2
          ? item.employee_name_2.toString().trim().toLowerCase()
          : "";
        const userNameLower = userName.toLowerCase();

        return (
          employeeName1 === userNameLower || employeeName2 === userNameLower
        );
      });

      // console.log(`After user filtering: ${filteredData.length} tasks found for user "${userName}"`);
    } else {
      // console.log('No valid username found for filtering');
      filteredData = [];
    }
  }

  // console.log('Final filtered rows count:', filteredData.length);

  const stats = {
    // Total Tasks: Count all rows
    totalTasks: filteredData.length,

    // Active Tasks: Tasks where actual3 is null (not completed)
    activeTasks:
      userRole === "admin"
        ? filteredData.filter(
          (item) => !item.actual3 || item.actual3.toString().trim() === ""
        ).length
        : 0,

    // Completed Today: Count where actual3 has data (completed)
    completedToday: filteredData.filter(
      (item) => item.actual3 && item.actual3.toString().trim() !== ""
    ).length,

    // Pending Issues: Same as active tasks for company/user view
    pendingIssues: filteredData.filter(
      (item) => !item.actual3 || item.actual3.toString().trim() === ""
    ).length,
  };

  // console.log('Final calculated stats:', stats);
  return stats;
};

// Get company table data from Supabase
const getCompanyTableDataFromSupabase = (supabaseData, companyData) => {
  // console.log('=== getCompanyTableDataFromSupabase ===');
  // console.log('supabaseData available:', !!supabaseData, 'length:', supabaseData?.length);
  // console.log('companyData:', companyData);

  if (
    !supabaseData ||
    !Array.isArray(supabaseData) ||
    !companyData ||
    !companyData.companyName
  ) {
    // console.log('Missing required data for company table');
    return [];
  }

  // console.log('Getting company table data for:', companyData.companyName);

  // Filter data for the company
  const filteredData = supabaseData.filter(
    (item) =>
      item.party_name &&
      item.party_name.toLowerCase() === companyData.companyName.toLowerCase()
  );

  // console.log('Filtered company data count:', filteredData.length);

  // Process and format the data
  const tableData = filteredData
    .map((item, index) => {
      // Determine status based on actual3 field
      let status = "Not Started";
      if (item.actual3 && item.actual3.toString().trim() !== "") {
        status = "Completed";
      } else if (item.planned3 && item.planned3.toString().trim() !== "") {
        status = "In Progress";
      }

      return {
        id: item.id || index + 1,
        taskNo: item.task_no || `Task-${index + 1}`,
        status: status,
        partyName: item.party_name || "N/A",
        typeOfWork: item.type_of_work || "N/A",
        systemName: item.system_name || "N/A",
        descriptionOfWork: item.description_of_work || "N/A",
        notes: item.notes || "N/A",
        takenFrom: item.taken_from || "N/A",
        expectedDateToClose: item.expected_date_to_close || "N/A",
        priority: item.priority_in_customer || "Normal",
        linkOfSystem: item.website_link || "N/A",
        attachmentFile: item.attachment_file || "N/A",
        actualSubmitDate: item.actual3 || "N/A",
      };
    })
    .filter((item) => item.taskNo !== "");

  // console.log('Final company table data processed:', tableData.length, 'rows');
  // console.log('Sample data:', tableData.slice(0, 2));
  // console.log('=== getCompanyTableDataFromSupabase DEBUG END ===');

  return tableData;
};


// ============================================================================
// CORRECTED TIME CALCULATION FUNCTIONS - REPLACE YOUR EXISTING ONES
// ============================================================================

// Main time difference calculation function with your exact logic
// ============================================================================
// CORRECTED TIME CALCULATION FUNCTION - Replace your existing calculateTimeDifference
// ============================================================================

// ============================================================================
// FINAL CORRECTED TIME CALCULATION - Replace completely
// ============================================================================

const calculateTimeDifference = (item) => {
  try {
    const planned3 = item.planned3;
    const actual3 = item.actual3;
    const planned2 = item.planned2;
    const actual2 = item.actual2;
    const howManyTimeTake = item.how_many_time_take;
    const howManyTimeTake2 = item.how_many_time_take_2;
    const actual1 = item.actual1;

    console.log("=== calculateTimeDifference DEBUG ===");
    console.log("Task:", item.task_no);
    console.log("planned3:", planned3);
    console.log("actual3:", actual3);
    console.log("planned2:", planned2);
    console.log("actual2:", actual2);
    console.log("how_many_time_take:", howManyTimeTake);
    console.log("how_many_time_take_2:", howManyTimeTake2);
    console.log("actual1:", actual1);

    // Helper to check if value is NOT NULL
    const isNotNull = (value) => {
      return value !== null &&
        value !== undefined &&
        value.toString().trim() !== "";
    };

    // Helper to check if value IS NULL
    const isNull = (value) => {
      return value === null ||
        value === undefined ||
        value.toString().trim() === "";
    };

    // Helper to check if string is a valid date (not a name)
    const isValidDateString = (str) => {
      if (!str || typeof str !== 'string') return false;

      // If it contains only letters and spaces, it's likely a name
      if (/^[a-zA-Z\s]+$/.test(str.trim())) {
        console.log(`"${str}" is a name, not a date`);
        return false;
      }

      // Check if it's a valid date
      const date = new Date(str);
      const isValid = !isNaN(date.getTime());
      console.log(`"${str}" is valid date:`, isValid);
      return isValid;
    };

    // 1️⃣ PRIMARY CONDITION: If BOTH planned3 AND actual3 are NOT NULL
    if (isNotNull(planned3) && isNotNull(actual3)) {
      console.log("✅ PRIMARY: Both planned3 AND actual3 NOT NULL → 0h 0m");
      return "0h 0m";
    }

    // 2️⃣ SECONDARY CONDITION: If planned3 is NOT NULL AND actual3 is NULL
    if (isNotNull(planned3) && isNull(actual3)) {
      console.log("✅ SECONDARY: planned3 NOT NULL, actual3 NULL");

      // 🧠 SUB-CONDITION A: Both planned2 AND actual2 are NULL
      if (isNull(planned2) && isNull(actual2)) {
        console.log("✅ SUB-A: Both planned2 and actual2 NULL");

        // Check if both values exist and are valid dates
        if (isNotNull(howManyTimeTake) && isNotNull(actual1)) {
          const howManyTimeTakeStr = howManyTimeTake.toString().trim();
          const actual1Str = actual1.toString().trim();

          // Validate both are dates, not names
          if (isValidDateString(howManyTimeTakeStr) && isValidDateString(actual1Str)) {
            console.log("📊 Calculating: how_many_time_take - actual1");
            console.log("Start date (actual1):", actual1Str);
            console.log("End date (how_many_time_take):", howManyTimeTakeStr);

            const result = calculateWorkingHoursDifference(actual1Str, howManyTimeTakeStr);
            console.log("✅ RESULT:", result);
            return result;
          } else {
            console.log("⚠️ how_many_time_take or actual1 is not a valid date");
            return "0h 0m";
          }
        } else {
          console.log("⚠️ Missing how_many_time_take or actual1");
          return "0h 0m";
        }
      }

      // 🧠 SUB-CONDITION B: Both planned2 AND actual2 are NOT NULL
      if (isNotNull(planned2) && isNotNull(actual2)) {
        console.log("✅ SUB-B: Both planned2 and actual2 NOT NULL");

        if (isNotNull(howManyTimeTake2)) {
          console.log("Using how_many_time_take_2:", howManyTimeTake2);
          const result = formatTimeWithWorkingHours(howManyTimeTake2);
          console.log("Result:", result);
          return result;
        }
        console.log("Missing how_many_time_take_2");
        return "0h 0m";
      }
    }

    console.log("❌ No conditions met → 0h 0m");
    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in calculateTimeDifference:", error);
    return "0h 0m";
  }
};

// Calculate difference considering working hours (10:00 AM - 06:00 PM)
// Calculate difference considering working hours (10:00 AM - 06:00 PM, Monday to Saturday)
const calculateWorkingHoursDifference = (startTimeStr, endTimeStr) => {
  try {
    console.log("📅 calculateWorkingHoursDifference called");
    console.log("Start:", startTimeStr);
    console.log("End:", endTimeStr);

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    console.log("Parsed start:", startTime.toString());
    console.log("Parsed end:", endTime.toString());

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.log("❌ Invalid dates");
      return "0h 0m";
    }

    // Ensure start is before end
    if (startTime >= endTime) {
      console.log("⚠️ Start time is after or equal to end time");
      return "0h 0m";
    }

    let totalWorkingMinutes = 0;
    const workStartHour = 10;  // 10:00 AM
    const workEndHour = 18;     // 06:00 PM
    const workingHoursPerDay = workEndHour - workStartHour; // 8 hours

    let currentDate = new Date(startTime);

    // Calculate difference in days
    const diffTime = Math.abs(endTime - startTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log("Total days span:", diffDays);

    // Loop through each day
    for (let day = 0; day <= diffDays; day++) {
      const dayDate = new Date(startTime);
      dayDate.setDate(startTime.getDate() + day);

      // 🔥 NEW: Check if it's Sunday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek === 0) {
        console.log(`Day ${day + 1} (${dayDate.toDateString()}): SUNDAY - Skipped ❌`);
        continue; // Skip Sunday
      }

      const dayStart = new Date(dayDate);
      dayStart.setHours(workStartHour, 0, 0, 0);

      const dayEnd = new Date(dayDate);
      dayEnd.setHours(workEndHour, 0, 0, 0);

      // Calculate actual working time for this day
      const actualStart = new Date(Math.max(startTime.getTime(), dayStart.getTime()));
      const actualEnd = new Date(Math.min(endTime.getTime(), dayEnd.getTime()));

      if (actualStart < actualEnd && actualStart < dayEnd && actualEnd > dayStart) {
        const dayMinutes = (actualEnd - actualStart) / (1000 * 60);

        // Ensure we don't exceed 8 hours (480 minutes) per day
        const cappedMinutes = Math.min(dayMinutes, workingHoursPerDay * 60);

        totalWorkingMinutes += cappedMinutes;
        console.log(`Day ${day + 1} (${dayDate.toDateString()}): Added ${cappedMinutes.toFixed(2)} minutes ✅`);
      }
    }

    console.log("Total working minutes (excluding Sundays):", totalWorkingMinutes);

    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const minutes = Math.floor(totalWorkingMinutes % 60);

    // Convert to days and hours (8-hour working day)
    const days = Math.floor(totalHours / 8);    // 8 घंटे = 1 working day
    const hours = totalHours % 8;               // Remaining hours

    let result;
    if (days > 0) {
      result = `${days}d ${hours}h ${minutes}m`;
    } else {
      result = `0d ${hours}h ${minutes}m`;
    }

    console.log("✅ Final result:", result);
    return result;

  } catch (error) {
    console.error("❌ Error in calculateWorkingHoursDifference:", error);
    return "0h 0m";
  }
};

// Format time with working hours consideration
const formatTimeWithWorkingHours = (timeStr) => {
  try {
    console.log("🔧 formatTimeWithWorkingHours:", timeStr);

    if (!timeStr || timeStr.toString().trim() === "") {
      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // Already in "Xh Ym" format
    if (str.includes('h') && str.includes('m')) {
      console.log("Already formatted");
      return str;
    }

    // Handle "X days" format
    if (str.toLowerCase().includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const hours = days * 8; // 8 working hours per day
        return `${hours}h 0m`;
      }
    }

    // Plain number (assume hours)
    if (/^\d+(\.\d+)?$/.test(str)) {
      const hours = parseFloat(str);
      const h = Math.floor(hours);
      const m = Math.floor((hours % 1) * 60);
      return `${h}h ${m}m`;
    }

    // Date string
    if (str.includes('T') || str.includes('-')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        return calculateWorkingHoursDifference(str, now.toISOString());
      }
    }

    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in formatTimeWithWorkingHours:", error);
    return "0h 0m";
  }
};

// Helper function to format minutes to "Xh Ym" format



// Helper function to parse time string to minutes
const parseTimeStringToMinutes = (timeStr) => {
  let totalMinutes = 0;

  // Extract hours
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }

  // Extract minutes
  const minutesMatch = timeStr.match(/(\d+)\s*m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }

  // If no h/m found but it's a number, assume hours
  if (totalMinutes === 0 && /^\d+$/.test(timeStr)) {
    totalMinutes = parseInt(timeStr) * 60;
  }

  return totalMinutes;
};

// Helper function to format minutes to "Xh Ym" format
const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h 0m`;
  } else {
    return `0h ${minutes}m`;
  }
};

// Helper function to check if value is a valid date
const isValidDate = (dateStr) => {
  if (!dateStr) return false;

  const str = dateStr.toString().trim();

  // Check if it's a name (contains letters but not date patterns)
  if (/^[a-zA-Z\s]+$/.test(str)) {
    return false;
  }

  // Check if it's a date string (contains date patterns)
  if (str.includes('T') || str.includes('-') || str.includes('/')) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }

  return false;
};

// Helper function to check if value is a time format
const isTimeFormat = (timeStr) => {
  if (!timeStr) return false;

  const str = timeStr.toString().trim();

  // Check for patterns like "Xh Ym", "X hours", "X days", etc.
  if (/(\d+\s*(h|hours?|hrs?))|(\d+\s*(d|days?))|(\d+\s*(m|min|minutes?))/i.test(str)) {
    return true;
  }

  // Check for simple numbers (assume they are hours)
  if (/^\d+$/.test(str)) {
    return true;
  }

  return false;
};

// Helper function to calculate difference between two dates
// Helper function to calculate difference between two dates
const calculateDifference = (dateStr1, dateStr2) => {
  try {
    console.log("Calculating difference between:", dateStr1, "and", dateStr2);

    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      console.log("Invalid dates provided");
      return "0h 0m";
    }

    const timeDifferenceMs = Math.abs(date1.getTime() - date2.getTime());
    const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

    return formatMinutesToDays(totalMinutes);
  } catch (error) {
    console.error("Error in calculateDifference:", error);
    return "0h 0m";
  }
};

// Enhanced helper function to format time spent from string
// Enhanced helper function to format time spent from string with days
const formatTimeSpent = (timeStr) => {
  try {
    console.log("Formatting time spent:", timeStr);

    if (!timeStr) {
      console.log("No time string provided");
      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // If it's already in proper format with days/hours/minutes, return as is
    if ((str.includes('day') || str.includes('d')) && str.includes('h') && str.includes('m')) {
      console.log("Time already formatted with days:", str);
      return formatToDaysHoursMinutes(str);
    }

    // If it's already in "Xh Ym" format, convert to days format
    if (str.includes('h') && str.includes('m')) {
      console.log("Converting existing h/m format to days format:", str);
      return convertHoursMinutesToDays(str);
    }

    // Handle simple numbers (assume they are hours)
    if (/^\d+$/.test(str)) {
      const totalHours = parseInt(str);
      console.log("Converting number to hours:", totalHours);
      return formatHoursToDays(totalHours);
    }

    // Handle "X days" format
    if (str.includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        console.log("Extracting days:", days);
        return `${days}day${days !== 1 ? 's' : ''} 0h 0m`;
      }
    }

    // Handle "X hours" format
    if (str.includes('hour')) {
      const hoursMatch = str.match(/(\d+)\s*hours?/i);
      if (hoursMatch) {
        const totalHours = parseInt(hoursMatch[1]);
        console.log("Extracting hours:", totalHours);
        return formatHoursToDays(totalHours);
      }
    }

    // Handle "X hours Y minutes" format
    const hoursMinutesMatch = str.match(/(\d+)\s*h\s*(\d+)\s*m/i) ||
      str.match(/(\d+)\s*hours?\s*(\d+)\s*minutes?/i);
    if (hoursMinutesMatch) {
      const hours = parseInt(hoursMinutesMatch[1]);
      const minutes = parseInt(hoursMinutesMatch[2]);
      console.log("Extracting hours and minutes:", hours, "h", minutes, "m");
      const totalHours = hours + (minutes / 60);
      return formatHoursToDays(totalHours);
    }

    // If it's a date string, calculate difference from current time
    if (str.includes('T')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const timeDifferenceMs = Math.abs(now.getTime() - date.getTime());
        const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
        return formatMinutesToDays(totalMinutes);
      }
    }

    console.log("Could not format time, returning default");
    return "0h 0m";
  } catch (error) {
    console.error("Error in formatTimeSpent:", error);
    return "0h 0m";
  }
};

// Helper function to format hours into days, hours, minutes
const formatHoursToDays = (totalHours) => {
  const days = Math.floor(totalHours / 24);
  const remainingHours = Math.floor(totalHours % 24);
  const minutes = Math.floor((totalHours * 60) % 60);

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${remainingHours}h${minutes}m`;
  } else {
    return `0day ${remainingHours}h ${minutes}m`;
  }
};

// Helper function to format minutes into days, hours, minutes
const formatMinutesToDays = (totalMinutes) => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Helper function to convert existing "Xh Ym" format to days format
const convertHoursMinutesToDays = (timeStr) => {
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const totalHours = hours + (minutes / 60);
  return formatHoursToDays(totalHours);
};

// Helper function to format existing days/hours/minutes string
const formatToDaysHoursMinutes = (timeStr) => {
  const daysMatch = timeStr.match(/(\d+)\s*day/);
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Format date function (unchanged)
// Enhanced date format function for assign dates
// Fixed date format function for ISO dates
const formatDateToDDMMYY = (dateInput) => {
  if (!dateInput || dateInput.toString().trim() === "") {
    return "No assign date";
  }

  try {
    const dateStr = dateInput.toString().trim();

    // Handle ISO date format (2025-05-03T00:00:00+00:00)
    if (dateStr.includes('T') && dateStr.includes('-')) {
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        return dateStr; // Return original if parsing fails
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());

      return `${day}/${month}/${year}`;
    }

    // Handle other date formats (existing logic)
    let date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[2].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[0];
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (!isNaN(dateStr) && dateStr.length > 4) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = parseInt(dateStr);
      date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateInput);
    return dateInput.toString().trim();
  }
};

// Process team data from Supabase
// Process team data from Supabase with latest dates
// Process team data from Supabase with team member logic - DEBUG VERSION
// Process team data from Supabase with team member logic - FIXED VERSION
// const processTeamDataFromSupabase = (supabaseData, userRole = "admin") => {
//   if (userRole !== "admin") {
//     return [];
//   }

//   if (!supabaseData || !Array.isArray(supabaseData)) {
//     return [];
//   }

//   const teamMap = new Map();

//   // Sort data by timestamp or id to get latest entries first
//   const sortedData = [...supabaseData].sort((a, b) => {
//     const timeA = a.timestamp || a.id || 0;
//     const timeB = b.timestamp || b.id || 0;
//     return timeB - timeA; // Descending order for latest first
//   });

//   console.log("=== DEBUG: Processing Team Data ===");

//   sortedData.forEach((item, index) => {
//     const teamMember = item.team_member_name?.trim().toLowerCase();
//     const employeeName = item.employee_name_1?.trim().toLowerCase();

//     // If team_member_name contains "team", use employee_name_1 instead
//     let memberName = teamMember;
//     if (teamMember && teamMember.includes("team") && employeeName) {
//       memberName = employeeName;
//     }

//     if (!memberName) return;

//     const teamName = item.team_name || "No Team";
//     const plannedData = item.planned3;
//     const actualData = item.actual3;

//     // DEBUG: Check all possible date fields
//     console.log(`Item ${index}:`, {
//       task_no: item.task_no,
//       memberName,
//       teamMember,
//       employeeName,
//       given_date: item.given_date,
//       actual1: item.actual1,
//       planned1: item.planned1,
//       actual2: item.actual2,
//       planned2: item.planned2,
//       actual3: item.actual3,
//       planned3: item.planned3,
//       timestamp: item.timestamp,
//       how_many_time_take: item.how_many_time_take,
//       how_many_time_take_2: item.how_many_time_take_2,
//     });

//     // CORRECTED: Use given_date as assign date
//     const assignDate = item.given_date || item.timestamp || item.actual1;

//     // 🔥 FIX: Calculate time spent for EVERY item, not just new members
//     const timeSpent = calculateTimeDifference(item);
//     console.log(`Time spent for ${memberName} (${item.task_no}):`, timeSpent);

//     // Only update if this member doesn't exist or if this is a newer entry
//     if (!teamMap.has(memberName)) {
//       teamMap.set(memberName, {
//         id: teamMap.size + 1,
//         name: memberName,
//         teamName,
//         avatar: memberName.charAt(0).toUpperCase(),
//         assignDate: assignDate ? formatDateToDDMMYY(assignDate) : "No assign date",
//         totalTasks: 0,
//         completedTasks: 0,
//         pendingTasks: 0,
//         status: "available",
//         latestAssignDate: assignDate,
//         timeSpent: timeSpent, // Use calculated time spent
//       });

//       console.log(`Created new member: ${memberName} with assign date: ${assignDate}`);
//     }

//     const member = teamMap.get(memberName);
//     member.totalTasks++;

//     const plannedHasData = plannedData && plannedData.toString().trim() !== "";
//     const actualHasData = actualData && actualData.toString().trim() !== "";

//     if (plannedHasData && actualHasData) {
//       member.completedTasks++;
//       member.status = "available";
//     } else if (plannedHasData && !actualHasData) {
//       member.pendingTasks++;
//       member.status = "busy";

//       // 🔥 FIX: Update time spent for pending tasks
//       // If this task is pending and has higher time spent, update it
//       const currentTimeMinutes = parseTimeStringToMinutes(member.timeSpent);
//       const newTimeMinutes = parseTimeStringToMinutes(timeSpent);

//       if (newTimeMinutes > currentTimeMinutes) {
//         member.timeSpent = timeSpent;
//         console.log(`Updated ${memberName} time spent to:`, timeSpent);
//       }
//     }

//     // Update to latest assign date if this entry is newer
//     if (assignDate) {
//       const currentDate = new Date(member.latestAssignDate || 0);
//       const newDate = new Date(assignDate);

//       if (!member.latestAssignDate || newDate > currentDate) {
//         member.assignDate = formatDateToDDMMYY(assignDate);
//         member.latestAssignDate = assignDate;
//         console.log(`Updated ${memberName} assign date to: ${assignDate}`);
//       }
//     }
//   });

//   console.log("=== DEBUG: Final Team Members ===");
//   teamMap.forEach((member, name) => {
//     console.log(`${name}:`, {
//       totalTasks: member.totalTasks,
//       assignDate: member.assignDate,
//       latestAssignDate: member.latestAssignDate,
//       timeSpent: member.timeSpent,
//     });
//   });

//   const teamMembers = Array.from(teamMap.values()).map((member) => ({
//     ...member,
//     tasksAssigned: member.pendingTasks,
//     tasksCompleted: member.completedTasks,
//     totalTasksGiven: member.totalTasks,
//     completionRate: member.totalTasks
//       ? Math.round((member.completedTasks / member.totalTasks) * 100)
//       : 0,
//     // Ensure timeSpent is preserved
//     timeSpent: member.timeSpent || "0h 0m",
//   }));

//   return teamMembers;
// };


// const processTeamDataFromSupabase = (supabaseData, userRole = "admin") => {
//   if (userRole !== "admin") {
//     console.log("❌ Not admin role, returning empty array");
//     return [];
//   }

//   if (!supabaseData || !Array.isArray(supabaseData)) {
//     console.log("❌ Invalid supabase data");
//     return [];
//   }

//   const teamMap = new Map();

//   // Sort data by timestamp or id to get latest entries first
//   const sortedData = [...supabaseData].sort((a, b) => {
//     const timeA = a.timestamp || a.id || 0;
//     const timeB = b.timestamp || b.id || 0;
//     return timeB - timeA;
//   });

//   console.log("=== 🚀 DEBUG: Processing Team Data ===");
//   console.log("Total records to process:", sortedData.length);
//   console.log("\n");

//   let processedCount = 0;
//   let skippedCount = 0;

//   sortedData.forEach((item, index) => {
//     // 🔍 ALWAYS LOG FIRST - Even if we skip later
//     console.log(`\n📋 Item ${index + 1}/${sortedData.length} - ${item.task_no || 'NO_TASK_NO'}:`);

//     const teamMember = item.team_member_name?.trim().toLowerCase();
//     const employeeName = item.employee_name_1?.trim().toLowerCase();

//     console.log(`   🏷️ team_member_name: "${item.team_member_name || 'null'}"`);
//     console.log(`   👤 employee_name_1: "${item.employee_name_1 || 'null'}"`);

//     let memberName = teamMember;
//     if (teamMember && teamMember.includes("team") && employeeName) {
//       memberName = employeeName;
//       console.log(`   🔄 Using employee_name_1 instead: "${memberName}"`);
//     } else {
//       console.log(`   ✅ Using team_member_name: "${memberName}"`);
//     }

//     if (!memberName) {
//       console.log(`   ⚠️ SKIPPED - No valid member name found`);
//       skippedCount++;
//       return;
//     }

//     processedCount++;

//     const teamName = item.team_name || "No Team";
//     const plannedData = item.planned3;
//     const actualData = item.actual3;

//     console.log(`   🏢 Team: ${teamName}`);
//     console.log(`   📅 planned3: ${plannedData || 'null'} (type: ${typeof plannedData})`);
//     console.log(`   ✅ actual3: ${actualData || 'null'} (type: ${typeof actualData})`);

//     const assignDate = item.given_date || item.timestamp || item.actual1;
//     const timeSpent = calculateTimeDifference(item);

//     // Create new member if doesn't exist
//     if (!teamMap.has(memberName)) {
//       teamMap.set(memberName, {
//         id: teamMap.size + 1,
//         name: memberName,
//         teamName,
//         avatar: memberName.charAt(0).toUpperCase(),
//         assignDate: assignDate ? formatDateToDDMMYY(assignDate) : "No assign date",
//         totalTasks: 0,
//         completedTasks: 0,
//         pendingTasks: 0,
//         status: "available",
//         nearestFutureDate: null,
//         latestAssignDate: assignDate,
//         timeSpent: timeSpent,
//       });

//       console.log(`   ✨ NEW MEMBER CREATED: ${memberName}`);
//     } else {
//       console.log(`   🔄 EXISTING MEMBER: ${memberName}`);
//     }

//     const member = teamMap.get(memberName);
//     member.totalTasks++;

//     // Check if data exists
//     const plannedHasData = plannedData && plannedData.toString().trim() !== "";
//     const actualHasData = actualData && actualData.toString().trim() !== "";

//     console.log(`   🔍 Data Check:`);
//     console.log(`      ├─ plannedHasData: ${plannedHasData}`);
//     console.log(`      └─ actualHasData: ${actualHasData}`);

//     // ============================================
//     // 🔥 STATUS LOGIC - PRIORITY BASED
//     // ============================================

//     if (plannedHasData && actualHasData) {
//       // ✅ Both exist → Task is Completed
//       member.completedTasks++;
//       console.log(`   ✅ TASK STATUS: COMPLETED`);
//       console.log(`      └─ Both planned3 and actual3 exist`);

//     } else if (plannedHasData && !actualHasData) {
//       // ⏳ planned3 exists, actual3 null → Pending Task
//       member.pendingTasks++;

//       console.log(`   ⏳ TASK STATUS: PENDING`);
//       console.log(`      └─ planned3 exists, actual3 is null`);

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const planned3Date = new Date(plannedData);

//       if (isNaN(planned3Date.getTime())) {
//         console.log(`   ⚠️ Invalid planned3 date format - cannot parse`);
//       } else {
//         planned3Date.setHours(0, 0, 0, 0);

//         const todayStr = today.toISOString().split('T')[0];
//         const plannedStr = planned3Date.toISOString().split('T')[0];

//         console.log(`   📆 Date Comparison:`);
//         console.log(`      ├─ Today:    ${todayStr}`);
//         console.log(`      └─ Planned3: ${plannedStr}`);

//         if (planned3Date > today) {
//           // 📆 Future date found
//           const futureDate = formatDateToDDMMYY(plannedData);
//           console.log(`   🔮 FUTURE TASK DETECTED: ${futureDate}`);

//           // Keep track of nearest future date
//           if (!member.nearestFutureDate || planned3Date < member.nearestFutureDate) {
//             member.nearestFutureDate = planned3Date;
//             console.log(`   🎯 UPDATED NEAREST FUTURE DATE: ${futureDate}`);
//           } else {
//             console.log(`   ⏭️ Not nearest (already have ${formatDateToDDMMYY(member.nearestFutureDate)})`);
//           }
//         } else if (planned3Date.getTime() === today.getTime()) {
//           console.log(`   📍 DUE TODAY - overdue/current task`);
//         } else {
//           console.log(`   ⏰ OVERDUE - planned3 < today`);
//         }
//       }

//       // Update time spent for pending tasks
//       const currentTimeMinutes = parseTimeStringToMinutes(member.timeSpent);
//       const newTimeMinutes = parseTimeStringToMinutes(timeSpent);

//       if (newTimeMinutes > currentTimeMinutes) {
//         member.timeSpent = timeSpent;
//         console.log(`   ⏱️ Time spent updated: ${timeSpent}`);
//       }

//     } else if (!plannedHasData && actualHasData) {
//       console.log(`   ℹ️ TASK STATUS: Only actual3 exists (no planned3)`);
//       member.completedTasks++;
//     } else {
//       console.log(`   ⚠️ TASK STATUS: Neither planned3 nor actual3 exists`);
//     }

//     // Update assign date
//     if (assignDate) {
//       const currentDate = new Date(member.latestAssignDate || 0);
//       const newDate = new Date(assignDate);

//       if (!member.latestAssignDate || newDate > currentDate) {
//         member.assignDate = formatDateToDDMMYY(assignDate);
//         member.latestAssignDate = assignDate;
//         console.log(`   📅 Assign date updated: ${member.assignDate}`);
//       }
//     }

//     console.log(`   📊 Current totals for ${memberName}:`);
//     console.log(`      ├─ Total: ${member.totalTasks}`);
//     console.log(`      ├─ Completed: ${member.completedTasks}`);
//     console.log(`      └─ Pending: ${member.pendingTasks}`);
//   });

//   // ============================================
//   // 🎯 FINAL STATUS DETERMINATION
//   // ============================================
//   console.log("\n\n");
//   console.log("═══════════════════════════════════════════════════");
//   console.log("🏁 FINAL STATUS DETERMINATION");
//   console.log("═══════════════════════════════════════════════════");
//   console.log(`\n📊 Total Records: ${sortedData.length}`);
//   console.log(`✅ Processed: ${processedCount}`);
//   console.log(`⚠️ Skipped: ${skippedCount}`);
//   console.log(`\n👥 Unique Members Found: ${teamMap.size}\n`);

//   teamMap.forEach((member, name) => {
//     console.log(`\n${"─".repeat(50)}`);
//     console.log(`👤 MEMBER: ${name.toUpperCase()}`);
//     console.log(`${"─".repeat(50)}`);

//     // Priority:
//     // 1. If has pending tasks with future dates → Show nearest future date
//     // 2. Otherwise → "available"

//     if (member.nearestFutureDate) {
//       member.status = formatDateToDDMMYY(member.nearestFutureDate);
//       console.log(`✅ Final Status: ${member.status}`);
//       console.log(`   └─ Reason: Has future task on ${member.status}`);
//     } else {
//       member.status = "available";
//       console.log(`✅ Final Status: available`);
//       console.log(`   └─ Reason: No future tasks pending`);
//     }

//     console.log(`\n📈 Statistics:`);
//     console.log(`   ├─ Total Tasks: ${member.totalTasks}`);
//     console.log(`   ├─ Completed: ${member.completedTasks}`);
//     console.log(`   ├─ Pending: ${member.pendingTasks}`);
//     console.log(`   ├─ Time Spent: ${member.timeSpent}`);
//     console.log(`   ├─ Team: ${member.teamName}`);
//     console.log(`   └─ Assign Date: ${member.assignDate}`);
//   });

//   console.log(`\n${"═".repeat(50)}`);

//   const teamMembers = Array.from(teamMap.values()).map((member) => ({
//     ...member,
//     tasksAssigned: member.pendingTasks,
//     tasksCompleted: member.completedTasks,
//     totalTasksGiven: member.totalTasks,
//     completionRate: member.totalTasks
//       ? Math.round((member.completedTasks / member.totalTasks) * 100)
//       : 0,
//     timeSpent: member.timeSpent || "0h 0m",
//   }));

//   console.log(`\n✅ Returning ${teamMembers.length} team members`);
//   console.log("═══════════════════════════════════════════════════\n\n");

//   return teamMembers;
// };


// UPDATED: Process team data from Supabase with dynamic team name lookup
const processTeamDataFromSupabase = async (supabaseData, userRole = "admin") => {
  if (userRole !== "admin") {
    console.log("❌ Not admin role, returning empty array");
    return [];
  }

  if (!supabaseData || !Array.isArray(supabaseData)) {
    console.log("❌ Invalid supabase data");
    return [];
  }

  const teamMap = new Map();

  // Sort data by timestamp or id to get latest entries first
  const sortedData = [...supabaseData].sort((a, b) => {
    const timeA = a.timestamp || a.id || 0;
    const timeB = b.timestamp || b.id || 0;
    return timeB - timeA;
  });

  console.log("=== 🚀 DEBUG: Processing Team Data ===");
  console.log("Total records to process:", sortedData.length);
  console.log("\n");

  let processedCount = 0;
  let skippedCount = 0;

  // 🔥 NEW: Process all items and collect unique member names first
  for (const item of sortedData) {
    const teamMember = item.team_member_name?.trim().toLowerCase();
    const employeeName = item.employee_name_1?.trim().toLowerCase();

    let memberName = teamMember;
    if (teamMember && teamMember.includes("team") && employeeName) {
      memberName = employeeName;
    }

    if (!memberName) {
      skippedCount++;
      continue;
    }

    // 🔥 NEW: Fetch team name dynamically from dropdown table
    if (!teamMap.has(memberName)) {
      const dynamicTeamName = await fetchTeamNameFromDropdown(memberName);
      
      const assignDate = item.given_date || item.timestamp || item.actual1;
      const timeSpent = calculateTimeDifference(item);

      teamMap.set(memberName, {
        id: teamMap.size + 1,
        name: memberName,
        teamName: dynamicTeamName, // 🔥 Using dynamic team name from dropdown
        avatar: memberName.charAt(0).toUpperCase(),
        assignDate: assignDate ? formatDateToDDMMYY(assignDate) : "No assign date",
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        status: "available",
        nearestFutureDate: null,
        latestAssignDate: assignDate,
        timeSpent: timeSpent,
      });

      console.log(`✨ NEW MEMBER CREATED: ${memberName} | Team: ${dynamicTeamName}`);
    }

    processedCount++;

    const member = teamMap.get(memberName);
    member.totalTasks++;

    const plannedData = item.planned3;
    const actualData = item.actual3;

    const plannedHasData = plannedData && plannedData.toString().trim() !== "";
    const actualHasData = actualData && actualData.toString().trim() !== "";

    if (plannedHasData && actualHasData) {
      member.completedTasks++;
      console.log(`   ✅ TASK STATUS: COMPLETED`);
    } else if (plannedHasData && !actualHasData) {
      member.pendingTasks++;
      console.log(`   ⏳ TASK STATUS: PENDING`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const planned3Date = new Date(plannedData);

      if (!isNaN(planned3Date.getTime())) {
        planned3Date.setHours(0, 0, 0, 0);

        if (planned3Date > today) {
          const futureDate = formatDateToDDMMYY(plannedData);
          console.log(`   🔮 FUTURE TASK DETECTED: ${futureDate}`);

          if (!member.nearestFutureDate || planned3Date < member.nearestFutureDate) {
            member.nearestFutureDate = planned3Date;
            console.log(`   🎯 UPDATED NEAREST FUTURE DATE: ${futureDate}`);
          }
        }
      }

      const currentTimeMinutes = parseTimeStringToMinutes(member.timeSpent);
      const newTimeMinutes = parseTimeStringToMinutes(calculateTimeDifference(item));

      if (newTimeMinutes > currentTimeMinutes) {
        member.timeSpent = calculateTimeDifference(item);
      }
    } else if (!plannedHasData && actualHasData) {
      member.completedTasks++;
    }

    // Update assign date
    if (item.given_date || item.timestamp || item.actual1) {
      const assignDate = item.given_date || item.timestamp || item.actual1;
      const currentDate = new Date(member.latestAssignDate || 0);
      const newDate = new Date(assignDate);

      if (!member.latestAssignDate || newDate > currentDate) {
        member.assignDate = formatDateToDDMMYY(assignDate);
        member.latestAssignDate = assignDate;
      }
    }
  }

  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("🏁 FINAL STATUS DETERMINATION");
  console.log("═══════════════════════════════════════════════════");

  teamMap.forEach((member, name) => {
    if (member.nearestFutureDate) {
      member.status = formatDateToDDMMYY(member.nearestFutureDate);
    } else {
      member.status = "available";
    }

    console.log(`\n👤 ${name.toUpperCase()} | Team: ${member.teamName}`);
    console.log(`   Status: ${member.status}`);
    console.log(`   Tasks: ${member.totalTasks} | Completed: ${member.completedTasks} | Pending: ${member.pendingTasks}`);
  });

  const teamMembers = Array.from(teamMap.values()).map((member) => ({
    ...member,
    tasksAssigned: member.pendingTasks,
    tasksCompleted: member.completedTasks,
    totalTasksGiven: member.totalTasks,
    completionRate: member.totalTasks
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0,
    timeSpent: member.timeSpent || "0h 0m",
  }));

  console.log(`\n✅ Returning ${teamMembers.length} team members`);
  console.log("═══════════════════════════════════════════════════\n\n");

  return teamMembers;
};


// NEW: Helper function to fetch team name from dropdown table
const fetchTeamNameFromDropdown = async (memberName) => {
  try {
    if (!memberName || memberName.trim() === "") {
      return "No Team";
    }

    const lowerName = memberName.trim().toLowerCase();

    const { data, error } = await supabase
      .from("dropdown")
      .select("team_name, member_name")
      .ilike("member_name", lowerName); // case-insensitive match

    if (error || !data || data.length === 0) {
      console.log(`No team found for member: ${memberName}`);
      return "No Team";
    }

    return data[0]?.team_name || "No Team";
  } catch (error) {
    console.error("Error fetching team name from dropdown:", error);
    return "No Team";
  }
};






// Process project data from Supabase (unchanged from your version)
const processProjectData = (supabaseData, userRole = "admin") => {
  // console.log('=== processProjectData DEBUG START ===');
  // console.log('userRole:', userRole);
  // console.log('supabaseData available:', !!supabaseData);
  // console.log('supabaseData length:', supabaseData ? supabaseData.length : 0);

  if (userRole !== "admin") {
    // console.log('Not admin role, returning empty array');
    return [];
  }

  if (!supabaseData || !Array.isArray(supabaseData)) {
    // console.log('No valid supabase data, returning empty array');
    return [];
  }

  // console.log('Supabase data sample:', supabaseData.slice(0, 2));

  const determineStage = (record) => {
    const { planned1, actual1, planned2, actual2, planned3, actual3 } = record;

    const hasData = (field) => field && field.toString().trim() !== "";
    const isEmpty = (field) => !field || field.toString().trim() === "";

    if (hasData(planned1) && isEmpty(actual1)) {
      return "Stage 1";
    }

    if (
      hasData(planned1) &&
      hasData(actual1) &&
      hasData(planned2) &&
      isEmpty(actual2)
    ) {
      return "Stage 2";
    }

    if (
      hasData(planned2) &&
      hasData(actual2) &&
      hasData(planned3) &&
      isEmpty(actual3)
    ) {
      return "Stage 3";
    }

    if (hasData(planned3) && hasData(actual3)) {
      return "Completed";
    }

    return "Not Started";
  };

  const projectData = [];
  let processedCount = 0;

  supabaseData.forEach((record, index) => {
    if (!record || typeof record !== "object") {
      // console.log(`Record ${index} is not valid:`, record);
      return;
    }

    const taskNo = record.task_no;
    const descriptionOfWork = record.description_of_work;

    if (
      (!taskNo || taskNo.toString().trim() === "") &&
      (!descriptionOfWork || descriptionOfWork.toString().trim() === "")
    ) {
      // console.log(`Skipping record ${index + 1}: No Task No or Description`);
      return;
    }

    processedCount++;

    const postedBy = record.posted_by;
    const typeOfWork = record.type_of_work;
    const takenFrom = record.taken_from;
    const partyName = record.party_name;
    const systemName = record.system_name;

    const currentStage = determineStage(record);

    const projectItem = {
      id: record.id || processedCount,
      taskNo: taskNo ? taskNo.toString().trim() : `Task-${processedCount}`,
      postedBy: postedBy ? postedBy.toString().trim() : "N/A",
      typeOfWork: typeOfWork ? typeOfWork.toString().trim() : "N/A",
      takenFrom: takenFrom ? takenFrom.toString().trim() : "N/A",
      partyName: partyName ? partyName.toString().trim() : "N/A",
      systemName: systemName ? systemName.toString().trim() : "N/A",
      descriptionOfWork: descriptionOfWork
        ? descriptionOfWork.toString().trim()
        : "N/A",
      stage1:
        currentStage === "Stage 1"
          ? "Active"
          : currentStage === "Stage 2" ||
            currentStage === "Stage 3" ||
            currentStage === "Completed"
            ? "Completed"
            : "Pending",
      stage2:
        currentStage === "Stage 2"
          ? "Active"
          : currentStage === "Stage 3" || currentStage === "Completed"
            ? "Completed"
            : "Pending",
      stage3:
        currentStage === "Stage 3"
          ? "Active"
          : currentStage === "Completed"
            ? "Completed"
            : "Pending",
      currentStage: currentStage,
      priority: "Normal",
      planned1: record.planned1 || "",
      actual1: record.actual1 || "",
      planned2: record.planned2 || "",
      actual2: record.actual2 || "",
      planned3: record.planned3 || "",
      actual3: record.actual3 || "",
      timestamp: record.timestamp || "",
      givenDate: record.given_date || "",
      status: record.status || "",
      teamName: record.team_name || "",
      assignedBy: record.assigned_by || "",
    };

    projectData.push(projectItem);
  });

  // console.log('=== processProjectData SUMMARY ===');
  // console.log('Total records processed:', processedCount);
  // console.log('Final project data length:', projectData.length);
  // console.log('=== processProjectData DEBUG END ===');

  return projectData;
};

// Company Filters Component for Supabase
function CompanyFilters({
  companyData,
  supabaseData,
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (supabaseData && companyData) {
      const data = supabaseData.filter(
        (item) =>
          item.party_name &&
          item.party_name.toLowerCase() ===
          companyData.companyName.toLowerCase()
      );
      setFilteredData(data);
    }
  }, [supabaseData, companyData]);

  // Get unique values with counts for dropdowns
  const getTypeOfWorkWithCounts = () => {
    const typeOfWorkCounts = {};
    filteredData.forEach((item) => {
      if (item.type_of_work) {
        typeOfWorkCounts[item.type_of_work] =
          (typeOfWorkCounts[item.type_of_work] || 0) + 1;
      }
    });
    return Object.entries(typeOfWorkCounts).map(([type, count]) => ({
      value: type,
      label: `${type}`,
      count: count,
    }));
  };

  const getStatusWithCounts = () => {
    const statusCounts = {
      "In Progress": 0,
      Completed: 0,
    };

    filteredData.forEach((item) => {
      const status = item.actual3 ? "Completed" : "In Progress";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      value: status,
      label: `${status}`,
      count: count,
    }));
  };

  const getPriorityWithCounts = () => {
    const priorityCounts = {};
    filteredData.forEach((item) => {
      if (item.priority_in_customer) {
        priorityCounts[item.priority_in_customer] =
          (priorityCounts[item.priority_in_customer] || 0) + 1;
      }
    });
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      value: priority,
      label: `${priority}`,
      count: count,
    }));
  };

  const typeOfWorkOptions = getTypeOfWorkWithCounts();
  const statusOptions = getStatusWithCounts();
  const priorityOptions = getPriorityWithCounts();

  return (
    <div className="p-4 mb-6 bg-white border border-gray-200 shadow-sm">
      <div className="grid items-center grid-cols-3 gap-4">
        {/* Type of Work Filter */}
        <div className="relative">
          <select
            value={filters.typeOfWork}
            onChange={(e) => onFilterChange("typeOfWork", e.target.value)}
            className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Type of Work</option>
            {typeOfWorkOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Status</option>
            {statusOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
            className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Priority</option>
            {priorityOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Clear Filters Button */}
        {(filters.typeOfWork || filters.status || filters.priority) && (
          <div className="col-span-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="bg-white/70 backdrop-blur-sm border-gray-200/60 text-gray-700 hover:bg-white/90 hover:text-gray-900 hover:border-gray-300/70 transition-all duration-200 shadow-sm font-medium px-4 py-2.5"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Company Table Component for Supabase
function CompanyTableSection({ companyData, supabaseData, filters }) {
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (supabaseData && companyData) {
      // First filter by company
      let data = supabaseData.filter(
        (item) =>
          item.party_name &&
          item.party_name.toLowerCase() ===
          companyData.companyName.toLowerCase()
      );

      // Then apply additional filters
      if (filters.typeOfWork) {
        data = data.filter((item) => item.type_of_work === filters.typeOfWork);
      }

      if (filters.status) {
        data = data.filter((item) => {
          const itemStatus = item.actual3 ? "Completed" : "In Progress";
          return itemStatus === filters.status;
        });
      }

      if (filters.priority) {
        data = data.filter(
          (item) => item.priority_in_customer === filters.priority
        );
      }

      setFilteredData(data);
    }
  }, [supabaseData, companyData, filters]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
              Tasks Overview
            </h2>
            <p className="text-sm text-gray-600 md:text-base">
              Track your company's tasks and progress
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredData.length} tasks found
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-auto border border-gray-200 rounded-lg lg:block max-h-96">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-blue-500">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Type of Work
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                System Name
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Description of Work
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Expected Date to Close
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Priority
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Assigned To
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const status = item.actual3 ? "Completed" : "In Progress";

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.type_of_work || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.system_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs text-sm text-gray-900 truncate">
                        {item.description_of_work || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.expected_date_to_close)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High"
                          ? "bg-red-100 text-red-800"
                          : item.priority_in_customer === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                          }`}
                      >
                        {item.priority_in_customer || "Normal"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.employee_name_1 || "N/A"}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No tasks found matching the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="p-4 space-y-4 overflow-y-auto lg:hidden max-h-96">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            const status = item.actual3 ? "Completed" : "In Progress";

            return (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {status}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High"
                      ? "bg-red-100 text-red-800"
                      : item.priority_in_customer === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                      }`}
                  >
                    {item.priority_in_customer || "Normal"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Type:
                    </span>
                    <div className="text-sm font-medium text-gray-900">
                      {item.type_of_work || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      System:
                    </span>
                    <div className="text-sm text-gray-900">
                      {item.system_name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Description:
                    </span>
                    <div className="text-sm text-gray-900">
                      {item.description_of_work || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Due Date:
                    </span>
                    <div className="text-sm text-gray-900">
                      {formatDate(item.expected_date_to_close)}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Assigned To:
                    </span>
                    <div className="text-sm text-gray-900">
                      {item.employee_name_1 || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <div className="text-gray-500">
              No tasks found matching the selected filters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
