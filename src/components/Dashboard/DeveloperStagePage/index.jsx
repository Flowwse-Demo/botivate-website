"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Code,
  Search,
  Clock,
  Target,
  History,
  RefreshCw,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../shared/Button";
import StatsCard from "../shared/StatsCard";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";

import { TabButton, SubmissionBanner } from "./SubComponents";
import { TABLE_COLUMNS } from "./dataTransform";
import TaskTable from "./TaskTable";
import { fetchTasksFromAPI, fetchInitialData, submitAssignments } from "./taskApi";

const PAGE_SIZE = 50;

export default function DeveloperStagePage({ onRefreshStats }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPostedBy, setFilterPostedBy] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [assignmentForm, setAssignmentForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Independent pagination state
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [pendingHasMore, setPendingHasMore] = useState(true);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [uniquePostedBy, setUniquePostedBy] = useState([]);
  const [teamMembers1, setTeamMembers1] = useState([]);
  const [teamMembers2, setTeamMembers2] = useState([]);

  const [visibleColumns, setVisibleColumns] = useState(
    TABLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [showColumnFilter, setShowColumnFilter] = useState(false);

  const observer = useRef();

  // ==================== DATA LOADING ====================
  const loadInitialTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInitialData();
      setTeamMembers1(data.teamMembers1);
      setTeamMembers2(data.teamMembers2);
      setPendingData(data.pendingTasks);
      setHistoryData(data.historyTasks);
      setPendingHasMore(data.pendingHasMore);
      setHistoryHasMore(data.historyHasMore);
      setPendingPage(0);
      setHistoryPage(0);
      setUniquePostedBy(data.uniquePostedBy);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTasks = useCallback(async (type) => {
    const currentPage = type === "pending" ? pendingPage : historyPage;
    const nextPage = currentPage + 1;

    setLoadingMore(true);
    try {
      const data = await fetchTasksFromAPI(type, nextPage);

      if (type === "pending") {
        setPendingData(prev => [...prev, ...data.tasks]);
        setPendingPage(nextPage);
        setPendingHasMore(data.hasMore);
      } else {
        setHistoryData(prev => [...prev, ...data.tasks]);
        setHistoryPage(nextPage);
        setHistoryHasMore(data.hasMore);
      }

      // Update uniquePostedBy with new entries
      const newPostedBy = data.tasks.map(t => t.postedBy).filter(Boolean);
      setUniquePostedBy(prev => [...new Set([...prev, ...newPostedBy])]);
    } catch (err) {
      toast.error("Error loading more tasks: " + err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [pendingPage, historyPage]);

  // Infinite Scroll Observer
  const lastTaskElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    const currentHasMore = activeTab === "pending" ? pendingHasMore : historyHasMore;

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentHasMore) {
        loadMoreTasks(activeTab);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, activeTab, pendingHasMore, historyHasMore, loadMoreTasks]);

  useEffect(() => {
    loadInitialTasks();
    const interval = setInterval(loadInitialTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadInitialTasks();
  };

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const handleSelectAllColumns = (selectAll) => {
    const newVisibleColumns = {};
    TABLE_COLUMNS.forEach((col) => {
      newVisibleColumns[col.key] = selectAll;
    });
    setVisibleColumns(newVisibleColumns);
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

  const handleAssignmentFormChange = (taskId, field, value) => {
    setAssignmentForm((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const handleSubmitAssignments = async () => {
    if (selectedTasks.size === 0) {
      toast.error("Please select at least one task to assign");
      return;
    }

    const incompleteTask = Array.from(selectedTasks).find((taskId) => {
      const form = assignmentForm[taskId];
      return !form?.assignedMember1 || !form?.dateTime;
    });

    if (incompleteTask) {
      toast.error(
        "Please fill required fields (Member1, Date/Time) for selected tasks"
      );
      return;
    }

    setSubmitting(true);
    try {
      const allTasks = [...pendingData, ...historyData];
      const { successCount, errorCount } = await submitAssignments(
        selectedTasks,
        allTasks,
        assignmentForm
      );

      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} task(s)!`);
        setSelectedTasks(new Set());
        setAssignmentForm({});
        loadInitialTasks();

        // Trigger dashboard stats refresh
        if (typeof onRefreshStats === 'function') {
          onRefreshStats();
        }
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} task(s) failed to update.`);
      }
    } catch (err) {
      toast.error("Error submitting assignments: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== FILTERING ====================
  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.taskNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.postedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descriptionOfWork?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPostedBy =
      filterPostedBy === "all" || item.postedBy === filterPostedBy;
    return matchesSearch && matchesPostedBy;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.taskNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.postedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descriptionOfWork?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPostedBy =
      filterPostedBy === "all" || item.postedBy === filterPostedBy;
    return matchesSearch && matchesPostedBy;
  });

  const displayedTasks =
    activeTab === "pending" ? filteredPendingData : filteredHistoryData;

  const pendingCount = pendingData.length;
  const historyCount = historyData.length;
  const currentHasMore = activeTab === "pending" ? pendingHasMore : historyHasMore;

  return (
    <div className="space-y-6">

      {loading && <LoadingIndicator message="Refreshing task data..." />}
      {error && <ErrorMessage error={error} />}

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="flex items-center space-x-3 text-2xl font-bold text-gray-900">
                <Code className="w-8 h-8 text-blue-500" />
                <span>Developer Stage - Team Leader Tasks</span>
              </h1>
              <p className="text-gray-600">
                Manage team leader tasks and assign team members
              </p>
            </div>
          </div>

          <div className="grid items-center grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search tasks, party name, system name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterPostedBy}
              onChange={(e) => setFilterPostedBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Posted By</option>
              {uniquePostedBy.map((postedBy) => (
                <option key={postedBy} value={postedBy}>
                  {postedBy}
                </option>
              ))}
            </select>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filter Columns</span>
              </Button>

              {showColumnFilter && (
                <div className="absolute right-0 z-20 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Show/Hide Columns
                      </h3>
                      <button
                        onClick={() => setShowColumnFilter(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-96">
                      <div className="pb-3 mb-3 border-b border-gray-200">
                        <label className="flex items-center p-2 space-x-2 rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={TABLE_COLUMNS.every(
                              (col) => visibleColumns[col.key]
                            )}
                            onChange={(e) =>
                              handleSelectAllColumns(e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            Select All
                          </span>
                        </label>
                      </div>
                      {TABLE_COLUMNS.map((column) => (
                        <label
                          key={column.key}
                          className="flex items-center p-2 space-x-2 rounded cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={() => handleColumnToggle(column.key)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {column.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex mb-6 border-b border-gray-200">
            <TabButton
              active={activeTab === "pending"}
              onClick={() => handleTabChange("pending")}
              icon={Clock}
              label="Pending"
              count={pendingCount}
              color="orange"
            />
            <TabButton
              active={activeTab === "history"}
              onClick={() => handleTabChange("history")}
              icon={History}
              label="History"
              count={historyCount}
              color="purple"
            />
          </div>

          {selectedTasks.size > 0 && (
            <SubmissionBanner
              selectedCount={selectedTasks.size}
              onSubmit={handleSubmitAssignments}
              submitting={submitting}
            />
          )}
        </div>

        <div
          className="relative overflow-x-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {loading ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Loading Tasks...
                  </h3>
                  <p className="text-gray-500">Refreshing task data</p>
                </div>
              </div>
            </div>
          ) : (
            <TaskTable
              displayedTasks={displayedTasks}
              activeTab={activeTab}
              selectedTasks={selectedTasks}
              handleCheckboxChange={handleCheckboxChange}
              assignmentForm={assignmentForm}
              handleAssignmentFormChange={handleAssignmentFormChange}
              teamMembers1={teamMembers1}
              teamMembers2={teamMembers2}
              visibleColumns={visibleColumns}
              TABLE_COLUMNS={TABLE_COLUMNS}
              lastTaskElementRef={lastTaskElementRef}
            />
          )}

          {/* Infinite Scroll Footer */}
          {displayedTasks.length > 0 && (
            <div className="py-8 border-t border-gray-100">
              {loadingMore && (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-600">Loading more tasks...</p>
                  <p className="text-xs text-gray-400">Please wait while we fetch the next batch</p>
                </div>
              )}

              {!currentHasMore && (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-12 h-1 bg-gray-200 rounded-full mb-2"></div>
                  <p className="text-sm font-medium text-gray-500">End of List</p>
                  <p className="text-xs text-gray-400">Total {displayedTasks.length} tasks matched</p>
                </div>
              )}

              {currentHasMore && !loadingMore && !loading && (
                <div className="flex justify-center">
                  <button
                    onClick={() => loadMoreTasks(activeTab)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Load More Tasks
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
                ? "No pending tasks found"
                : "No historical tasks found"}
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
