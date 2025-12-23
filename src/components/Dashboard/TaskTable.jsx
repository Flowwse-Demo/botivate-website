"use client";

import { useState, useEffect } from "react";
import React from "react";
import {
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  Save,
  Users,
  History,
  Filter,
} from "lucide-react";
import supabase from "../../supabaseClient";

// ==================== COMPONENTS ====================

const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400",
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? "cursor-not-allowed" : ""
        }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const StatsCard = ({ title, count, description, icon: Icon, color }) => (
  <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{count}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <div
        className={`w-12 h-12 bg-gradient-to-r ${color === "text-orange-600"
          ? "from-orange-500 to-red-600"
          : color === "text-purple-600"
            ? "from-purple-500 to-indigo-600"
            : "from-green-500 to-emerald-600"
          } rounded-lg flex items-center justify-center`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const LoadingIndicator = ({ message }) => (
  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
    <div className="flex items-center space-x-2">
      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      <span className="text-blue-800">{message}</span>
    </div>
  </div>
);

const ErrorMessage = ({ error }) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <div className="flex items-center space-x-2">
      <AlertCircle className="w-4 h-4 text-red-600" />
      <span className="text-red-800">Error: {error}</span>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label, count, color }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors ${active
      ? `text-${color}-600 border-b-2 border-${color}-600 bg-${color}-50`
      : "text-gray-500 hover:text-gray-700"
      }`}
  >
    <div className="flex flex-col items-center justify-center space-y-1 md:flex-row md:space-x-2 md:space-y-0">
      <Icon className="w-4 h-4" />
      <span className="leading-tight text-center">{label}</span>
      <span
        className={`bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded-full`}
      >
        {count}
      </span>
    </div>
  </button>
);

const SubmissionBanner = ({ selectedCount, onSubmit, submitting }) => (
  <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-blue-800">
          {selectedCount} task(s) selected for assignment
        </span>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center justify-center w-full space-x-2 text-white bg-blue-600 hover:bg-blue-700 sm:w-auto"
      >
        <Save className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

const AssignmentInput = ({ type, value, onChange, placeholder, options = [], isTeam = false }) => {
  const formatName = (name) =>
    typeof name === "string" ? name : "";

  if (type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-auto px-2 py-1 text-sm border border-gray-300 rounded max-w-max focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select Member</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'date' && isTeam) {
    // ✅ TIME RESTRICTION REMOVED - All hours allowed
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)} // Directly pass value
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
    />
  );
};
// ==================== CONSTANTS ====================

const API_CONFIG = {
  FETCH_URL:
    "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec?sheet=FMS&action=fetch",
  UPDATE_URL:
    "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec",
  MASTER_SHEET_URL:
    "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec?sheet=Master%20Sheet%20Link&action=fetch",
};

const TABLE_COLUMNS = [
  { key: "task_no", label: "Task No", index: 1 },
  { key: "given_date", label: "Given Date", index: 2 },
  { key: "posted_by", label: "Posted By", index: 3 },
  { key: "type_of_work", label: "Type Of Work", index: 4 },
  { key: "taken_from", label: "Taken From", index: 5 },
  { key: "party_name", label: "Party Name", index: 6 },
  { key: "system_name", label: "System Name", index: 7 },
  { key: "description_of_work", label: "Description Of Work", index: 8 },
  { key: "link_of_system", label: "Link Of System", index: 9 },
  { key: "attachment_file", label: "Attachment File", index: 10 },
  { key: "priority_in_customer", label: "Priority In Customer", index: 11 },
  { key: "notes", label: "Notes", index: 12 },
  { key: "expected_date_to_close", label: "Expected Date To Close", index: 13 },
];
// Add this after the TABLE_COLUMNS constant and before the main component
const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid date

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
};
// ==================== MAIN COMPONENT ====================

export default function TaskAssignmentSystem() {
  // ==================== STATE ====================
  const [allTasks, setAllTasks] = useState([]); // Store ALL tasks here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [assignmentForm, setAssignmentForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  

  const [visibleColumns, setVisibleColumns] = useState(
    TABLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [showColumnFilter, setShowColumnFilter] = useState(false);

  // Add this handler function (Event Handlers section mein)
  const handleColumnToggle = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleSelectAllColumns = (selectAll) => {
  const newVisibleColumns = {};
  TABLE_COLUMNS.forEach(col => {
    newVisibleColumns[col.key] = selectAll;
  });
  setVisibleColumns(newVisibleColumns);
};


  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("member_name"); // adjust to your actual column

      if (error) throw error;

      const members = [
        ...new Set(data.map((row) => row.member_name).filter(Boolean)),
      ];

      setTeamMembers(members);
    } catch (err) {
      console.error("Error fetching team members:", err);
      // fallback dummy
      setTeamMembers([
        "Satyendra",
        "Chetan",
        "Vikas",
        "Digendra",
        "Pratap",
        "Rahul",
        "Priya",
        "Amit",
      ]);
    }
  };

  const transformSheetData = (rawData) => {
    const tasks = rawData.map((row, index) => {
      // ✅ Determine status directly from planned1 / actual1
      let status = "pending";
      if (row.planned1 && row.actual1) {
        status = "completed";
      } else if (row.planned1 && !row.actual1) {
        status = "pending";
      }

      return {
        id: row.id,
        status,

        // Direct Supabase field mappings
        planned1: row.planned1 || null,
        actual1: row.actual1 || null,
        team_member_name: row.team_member_name || "",
        how_many_time_take: row.how_many_time_take || "",
        remarks: row.remarks || "",

        // Other FMS fields

        task_no: row.task_no || "",
        given_date: row.given_date || "",
        posted_by: row.posted_by || "",
        type_of_work: row.type_of_work || "",
        taken_from: row.taken_from || "",
        party_name: row.party_name || "",
        system_name: row.system_name || "",
        description_of_work: row.description_of_work || "",
        link_of_system: row.link_of_system || "",
        attachment_file: row.attachment_file || "",
        priority_in_customer: row.priority_in_customer || "",
        notes: row.notes || "",
        expected_date_to_close: row.planned3 || "",
      };
    });

    // ✅ Sorting: assigned (planned1 but no actual1) first
    return tasks.sort((a, b) => {
      const aIsCurrentlyAssigned = a.planned1 && !a.actual1;
      const bIsCurrentlyAssigned = b.planned1 && !b.actual1;

      if (aIsCurrentlyAssigned && !bIsCurrentlyAssigned) return -1;
      if (!aIsCurrentlyAssigned && bIsCurrentlyAssigned) return 1;
      if (aIsCurrentlyAssigned && bIsCurrentlyAssigned) return b.id - a.id;

      return b.id - a.id;
    });
  };

  const filterTasksByStatus = (tasks, status) => {
    return tasks.filter((task) => {
      if (status === "pending") {
        // planned1 filled, actual1 empty
        return task.planned1 && !task.actual1;
      } else if (status === "completed") {
        // planned1 + actual1 both filled
        return task.planned1 && task.actual1;
      } else if (status === "history") {
        // history shows tasks with any assignment details
        return task.team_member_name || task.how_many_time_take || task.remarks;
      }
      return true; // if no filter, return all
    });
  };

  // ==================== API FUNCTIONS ====================
  const fetchTasksFromAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from("FMS").select("*"); // or only needed columns

      if (error) throw error;

      const transformedTasks = transformSheetData(data); // 👈 you can reuse transformation
      setAllTasks(transformedTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitTaskAssignment = async (task, formData) => {
    try {
      const submissionDate = new Date().toISOString();

      const isTeam = /\bteam$/i.test((formData.assignedMember || "").trim());

      const updatePayload = isTeam
        ? {
          team_member_name: formData.assignedMember,
          how_many_time_take: formData.timeRequired,
          remarks: formData.remarks,
          actual1: submissionDate,
          employee_name_1: formData.assignedMember,
        }
        : {
          actual1: submissionDate,
          how_many_time_take: formData.timeRequired,
          remarks: formData.remarks,
          team_member_name: formData.assignedMember,
          employee_name_1: formData.assignedMember,
        };

      const { data, error } = await supabase
        .from("FMS")
        .update(updatePayload)
        .eq("task_no", task.task_no); // adjust if primary key is different

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error("Error updating task assignment:", err);
      return { success: false, error: err.message };
    }
  };

  // ==================== EVENT HANDLERS ====================
  const handleRefresh = () => {
    fetchTasksFromAPI();
    fetchTeamMembers();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedTasks(new Set());
    setAssignmentForm({});
  };

  const handleCheckboxChange = (taskId, checked) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
      const newForm = { ...assignmentForm };
      delete newForm[taskId];
      setAssignmentForm(newForm);
    }
    setSelectedTasks(newSelected);
  };

  const handleFormChange = (taskId, field, value) => {
    setAssignmentForm((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedTasks.size === 0) {
      alert("Please select at least one task to assign");
      return;
    }

    const incompleteTask = Array.from(selectedTasks).find((taskId) => {
      const form = assignmentForm[taskId];
      return !form?.assignedMember; // 👈 ab sirf member name required hai
    });

    if (incompleteTask) {
      alert("Please select Member Name for all selected tasks");
      return;
    }

    setSubmitting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each selected task
      for (const taskId of selectedTasks) {
        try {
          const task = displayedTasks.find((t) => t.task_no === taskId);
          const formData = assignmentForm[taskId] || {};

          const result = await submitTaskAssignment(task, formData);

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(
              `Failed to update task ${task.taskNo}:`,
              result.error
            );
          }
        } catch (taskError) {
          errorCount++;
          console.error(`Error updating task ${taskId}:`, taskError);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        alert(`Successfully assigned ${successCount} task(s)!`);
      } else if (successCount > 0 && errorCount > 0) {
        alert(
          `Assigned ${successCount} task(s) successfully, but ${errorCount} failed. Check console for details.`
        );
      } else {
        throw new Error(`Failed to assign all ${errorCount} task(s)`);
      }

      // Reset and refresh
      setSelectedTasks(new Set());
      setAssignmentForm({});
      fetchTasksFromAPI();
    } catch (err) {
      console.error("Error submitting assignments:", err);
      alert("Error submitting assignments: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchTasksFromAPI();
    fetchTeamMembers();
  }, []); // Only fetch once when component mounts
  // ==================== COMPUTED VALUES ====================
  const displayedTasks = filterTasksByStatus(allTasks, activeTab); // Filter for current tab
  const pendingCount = filterTasksByStatus(allTasks, "pending").length;
  const historyCount = filterTasksByStatus(allTasks, "history").length;
  const allColumnsSelected = TABLE_COLUMNS.every(col => visibleColumns[col.key]);
const someColumnsSelected = TABLE_COLUMNS.some(col => visibleColumns[col.key]);

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatsCard
          title="Pending Tasks"
          count={pendingCount}
          description="Ready for assignment"
          icon={Clock}
          color="text-orange-600"
        />
        <StatsCard
          title="Assignment History"
          count={historyCount}
          description="Tasks with assignment data"
          icon={History}
          color="text-purple-600"
        />
      </div>

      {/* Loading and Error States */}
      {loading && (
        <LoadingIndicator message="Fetching data from Google Sheets..." />
      )}
      {error && <ErrorMessage error={error} />}

      {/* Main Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 md:p-6">
          {/* Header Section */}
          <div className="flex flex-col mb-4 md:flex-row md:items-center md:justify-between md:mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Task Assignment System
              </h1>
              <p className="text-sm text-gray-600 md:text-base">
                Assign tasks to team members efficiently
              </p>
            </div>

            <div className="relative flex justify-end p-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="flex items-center justify-center ml-5 w-full space-x-2 md:w-auto"
              >
                <Filter className="w-4 h-4" />
                <span>Filter Columns</span>
              </Button>

              {showColumnFilter && (
                <div className="absolute right-0 z-20 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Show/Hide Columns</h3>
                      <button
                        onClick={() => setShowColumnFilter(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      <div className="pb-3 mb-3 border-b border-gray-200">
    <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
     <input
      type="checkbox"
      checked={TABLE_COLUMNS.every(col => visibleColumns[col.key])}
      onChange={(e) => handleSelectAllColumns(e.target.checked)}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
      <span className="text-sm font-semibold text-gray-900">Select All</span>
    </label>
  </div>
                      {TABLE_COLUMNS.map((column) => (
                        <label
                          key={column.key}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={() => handleColumnToggle(column.key)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{column.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>


            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center w-full space-x-2 md:w-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Task Status Tabs - Mobile Responsive */}
          <div className="flex flex-col mb-4 border-b border-gray-200 sm:flex-row md:mb-6">
            <div className="flex w-full">
              <TabButton
                active={activeTab === "pending"}
                onClick={() => handleTabChange("pending")}
                icon={Clock}
                label="Pending Assignment"
                count={pendingCount}
                color="orange"
              />
              <TabButton
                active={activeTab === "history"}
                onClick={() => handleTabChange("history")}
                icon={History}
                label="Assignment History"
                count={historyCount}
                color="purple"
              />
            </div>
          </div>

          {/* Submission Banner - Mobile Responsive */}
          {selectedTasks.size > 0 && (
            <div className="p-3 border border-blue-200 rounded-lg md:p-4 bg-blue-50">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Users className="flex-shrink-0 w-4 h-4 text-blue-600 md:w-5 md:h-5" />
                  <span className="text-sm font-medium text-blue-800 md:text-base">
                    {selectedTasks.size} task(s) selected for assignment
                  </span>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center justify-center w-full space-x-2 text-white bg-blue-600 hover:bg-blue-700 sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm md:text-base">
                    {submitting ? "Submitting..." : "Submit Assignments"}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Table */}
        <div className="relative overflow-x-auto" style={{ maxHeight: "70vh" }}>
          {loading ? (
            /* Loading State for Table */
            <div className="py-16 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Loading{" "}
                    {activeTab === "pending"
                      ? "Pending Tasks"
                      : "Assignment History"}
                    ...
                  </h3>
                  <p className="text-gray-500">
                    Fetching data from Google Sheets
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="overflow-hidden bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    {/* Table Header with sticky positioning */}
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                      <tr>
                        {activeTab === "pending" && (
                          <th className="w-12 px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                            Select
                          </th>
                        )}
                        {activeTab === "pending" && (
                          <>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[150px]">
                              Assign Member
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[120px]">
                              Time Required
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[150px]">
                              Remarks
                            </th>
                          </>
                        )}
                        {activeTab === "history" && (
                          <>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[150px]">
                              Assigned Member
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[120px]">
                              Time Required
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase min-w-[150px]">
                              Remarks
                            </th>
                          </>
                        )}
                        {TABLE_COLUMNS.filter(col => visibleColumns[col.key]).map((column) => (
                          <th
                            key={column.key}
                            className={`px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase ${column.key === "description_of_work"
                                ? "min-w-[300px] max-w-[400px]"
                                : "min-w-[100px]"
                              }`}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedTasks.map((task) => (
                        <tr key={task.task_no} className="hover:bg-gray-50">
                          {/* Checkbox - Only for pending tab */}
                          {activeTab === "pending" && (
                            <td className="w-12 px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedTasks.has(task.task_no)}
                                onChange={(e) =>
                                  handleCheckboxChange(task.task_no, e.target.checked)
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          )}

                          {/* Assignment Form Columns for Pending Tab */}
                          {activeTab === "pending" && (
                            <>
                              <td className="px-4 py-3 min-w-[150px]">
                                {selectedTasks.has(task.task_no) ? (
                                  <AssignmentInput
                                    type="select"
                                    value={assignmentForm[task.task_no]?.assignedMember || ""}
                                    onChange={(value) =>
                                      handleFormChange(task.task_no, "assignedMember", value)
                                    }
                                    options={teamMembers}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 min-w-[120px]">
                                {selectedTasks.has(task.task_no) ? (
                                  <AssignmentInput
                                    type="date"
                                    isTeam
                                    value={assignmentForm[task.task_no]?.timeRequired || ""}
                                    onChange={(value) =>
                                      handleFormChange(task.task_no, "timeRequired", value)
                                    }
                                    placeholder="e.g., 2 hours"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 min-w-[150px]">
                                {selectedTasks.has(task.task_no) ? (
                                  <AssignmentInput
                                    type="text"
                                    value={assignmentForm[task.task_no]?.remarks || ""}
                                    onChange={(value) =>
                                      handleFormChange(task.task_no, "remarks", value)
                                    }
                                    placeholder="Add remarks"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* Assignment History Columns for History Tab */}
                          {activeTab === "history" && (
                            <>
                              <td className="px-4 py-3 min-w-[150px]">
                                <span className="text-sm font-medium text-gray-900">
                                  {task.team_member_name || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 min-w-[120px]">
                                <span className="text-sm text-gray-900">
                                  {task.how_many_time_taken || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 min-w-[150px]">
                                <span className="text-sm text-gray-900">
                                  {task.remarks || "-"}
                                </span>
                              </td>
                            </>
                          )}

                          {/* Data Columns */}
                          {TABLE_COLUMNS.filter(col => visibleColumns[col.key]).map((column) => (
                            <td
                              key={column.key}
                              className={`px-4 py-3 text-sm text-gray-900 ${column.key === "description_of_work"
                                  ? "min-w-[300px] max-w-[400px]"
                                  : "min-w-[100px]"
                                }`}
                            >
                              {column.key === "link_of_system" && task[column.key] ? (
                                <a
                                  href={task[column.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 break-all hover:underline"
                                >
                                  Link
                                </a>
                              ) : column.key === "attachment_file" && task[column.key] ? (
                                <a
                                  href={task[column.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 break-all hover:underline"
                                >
                                  Attachment File
                                </a>
                              ) : column.key === "given_date" ||
                                column.key === "expected_date_to_close" ? (
                                formatDate(task[column.key])
                              ) : column.key === "description_of_work" || column.key === "notes" ? (
                                <div className="leading-relaxed break-words whitespace-normal">
                                  {task[column.key]}
                                </div>
                              ) : column.key === "priority_in_customer" ? (
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${(task[column.key] || "").toString() === "Critical"
                                    ? "bg-red-100 text-red-800"
                                    : (task[column.key] || "").toString() === "High"
                                      ? "bg-orange-100 text-orange-800"
                                      : (task[column.key] || "").toString() === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                >
                                  {task[column.key]}
                                </span>
                              ) : (
                                <div className="overflow-hidden whitespace-nowrap text-ellipsis">
                                  {task[column.key]}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="p-4 space-y-4 md:hidden">
                {displayedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    {/* Mobile Task Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {activeTab === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.task_no)}
                            onChange={(e) =>
                              handleCheckboxChange(task.id, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                        <h3 className="font-medium text-gray-900">
                          Task #{task.taskNo}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(task.givenDate)}
                      </span>
                    </div>

                    {/* Mobile Assignment Section - Only for pending tab */}
                    {activeTab === "pending" &&
                      selectedTasks.has(task.task_no) && (
                        <div className="p-3 mb-3 space-y-2 rounded-lg bg-gray-50">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">
                              Assign Member
                            </label>
                            <AssignmentInput
                              type="select"
                              value={
                                assignmentForm[task.id]?.assignedMember || ""
                              }
                              onChange={(value) =>
                                handleFormChange(
                                  task.id,
                                  "assignedMember",
                                  value
                                )
                              }
                              options={teamMembers}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">
                              Time Required
                            </label>
                            <AssignmentInput
                              type="date"
                              isTeam
                              value={
                                assignmentForm[task.id]?.timeRequired || ""
                              }
                              onChange={(value) =>
                                handleFormChange(task.id, "timeRequired", value)
                              }
                              placeholder="e.g., 2 hours"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">
                              Remarks
                            </label>
                            <AssignmentInput
                              type="text"
                              value={assignmentForm[task.id]?.remarks || ""}
                              onChange={(value) =>
                                handleFormChange(task.id, "remarks", value)
                              }
                              placeholder="Add remarks"
                            />
                          </div>
                        </div>
                      )}

                    {/* Mobile Assignment History - Only for history tab */}
                    {activeTab === "history" &&
                      (task.assignedMember ||
                        task.timeRequired ||
                        task.remarks) && (
                        <div className="p-3 mb-3 rounded-lg bg-green-50">
                          <h4 className="mb-2 text-xs font-medium text-green-800">
                            Assignment Details
                          </h4>
                          <div className="space-y-1 text-xs text-green-700">
                            {task.assignedMember && (
                              <div>
                                <span className="font-medium">Member:</span>{" "}
                                {task.assignedMember}
                              </div>
                            )}
                            {task.timeRequired && (
                              <div>
                                <span className="font-medium">Time:</span>{" "}
                                {task.timeRequired}
                              </div>
                            )}
                            {task.remarks && (
                              <div>
                                <span className="font-medium">Remarks:</span>{" "}
                                {task.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Mobile Task Details */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Posted By:
                        </span>{" "}
                        {task.postedBy}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Work Type:
                        </span>{" "}
                        {task.typeOfWork}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Party:
                        </span>{" "}
                        {task.partyName}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          System:
                        </span>{" "}
                        {task.systemName}
                      </div>
                      {task.descriptionOfWork && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Description:
                          </span>{" "}
                          {task.descriptionOfWork}
                        </div>
                      )}
                      {task.expectedDateToClose && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Expected Close:
                          </span>{" "}
                          {formatDate(task.expectedDateToClose)}
                        </div>
                      )}
                      {task.priorityInCustomer && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Priority:
                          </span>{" "}
                          {task.priorityInCustomer}
                        </div>
                      )}
                      {task.notes && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Notes:
                          </span>{" "}
                          {task.notes}
                        </div>
                      )}
                    </div>

                    {/* Mobile Links */}
                    <div className="flex pt-3 mt-3 space-x-4 border-t border-gray-100">
                      {task.linkOfSystem && (
                        <a
                          href={task.linkOfSystem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          System Link
                        </a>
                      )}
                      {task.attachmentFile && (
                        <a
                          href={task.attachmentFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Attachment
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Empty State */}
        {displayedTasks.length === 0 && !loading && (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              {activeTab === "history" ? (
                <History className="w-8 h-8 text-gray-400" />
              ) : (
                <Clock className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No tasks found
            </h3>
            <p className="text-gray-500">
              {activeTab === "pending"
                ? "No tasks pending assignment"
                : "No assignment history found"}
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-4 text-white bg-blue-600 hover:bg-blue-700"
            >
              Refresh Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
