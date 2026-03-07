"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    Clock,
    Search,
    RefreshCw,
    Filter,
} from "lucide-react";
import supabase from "../../../supabaseClient";
import { GOOGLE_SHEETS_URL as GOOGLE_SHEETS_BASE_URL } from "../../../config/api";

import { TABLE_COLUMNS, transformSupabaseData, fetchMasterSheetLinkData } from "./dataTransform";
import { PAGE_SIZE, fetchTasksByType, submitTasks, forwardTask } from "./taskApi";
import { Button, LoadingState, ErrorState } from "./SubComponents";
import TaskTable from "./TaskTable";
import MobileCards from "./MobileCards";
import AssignmentPopup from "./AssignmentPopup";

export default function TaskList({
    type = "all",
    userFilterData = null,
    companyData = null,
}) {
    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterParty, setFilterParty] = useState("all");
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
    const [pendingData, setPendingData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [uniqueParties, setUniqueParties] = useState([]);
    const [teamMembers1, setTeamMembers1] = useState([]);
    const [teamMembers2, setTeamMembers2] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [masterSheetData, setMasterSheetData] = useState(null);
    const [masterSheetLoading, setMasterSheetLoading] = useState(false);
    const [forwardingInProgress, setForwardingInProgress] = useState(false);

    // Pagination state
    const [pendingPage, setPendingPage] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const [pendingHasMore, setPendingHasMore] = useState(true);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState(
        TABLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );
    const [showColumnFilter, setShowColumnFilter] = useState(false);

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

    // Config
    const GOOGLE_SHEETS_URL = GOOGLE_SHEETS_BASE_URL;

    // User type checks
    const isCompanyUser = companyData && companyData.companyName;
    const isAdminUser = userFilterData?.isAdmin || userRole === "admin";

    // Visible columns logic
    const getVisibleColumns = () => {
        let columns = TABLE_COLUMNS.filter(col => visibleColumns[col.key]);

        if (isCompanyUser) {
            const companyColumns = [
                { key: "typeOfWork", label: "Type Of Work" },
                { key: "partyName", label: "Party Name" },
                { key: "systemName", label: "System Name" },
                { key: "descriptionOfWork", label: "Description Of Work" },
                { key: "linkOfSystem", label: "Link Of System" },
                { key: "priorityInCustomer", label: "Priority In Customer" },
                { key: "notes", label: "Notes" },
                { key: "expectedDateToClose", label: "Expected Date To Close" },
            ];
            return companyColumns.filter(col => visibleColumns[col.key]);
        }

        if (type === "pending") {
            columns = columns.filter((col) => col.key !== "actualDate");
        }

        return columns;
    };

    const filteredColumns = getVisibleColumns();

    // User session helpers
    const getCurrentUser = () => {
        if (userFilterData && userFilterData.username) {
            return userFilterData.username;
        }
        try {
            const session = sessionStorage.getItem("userSession");
            if (session) {
                const userData = JSON.parse(session);
                return userData.username || currentUser;
            }
        } catch (e) {
            console.error("Error parsing session:", e);
        }
        return currentUser || "Unknown";
    };

    const getUserRole = () => {
        if (userFilterData) {
            return userFilterData.isAdmin ? "admin" : "user";
        }
        try {
            const session = sessionStorage.getItem("userSession");
            if (session) {
                const userData = JSON.parse(session);
                return userData.role || "user";
            }
        } catch (e) {
            console.error("Error parsing session:", e);
        }
        return "user";
    };

    useEffect(() => {
        const user = getCurrentUser();
        const role = getUserRole();
        setCurrentUser(user);
        setUserRole(role);
    }, []);

    // Access control
    const canUserAccessTask = (task) => {
        if (isCompanyUser || (userFilterData && userFilterData.isAdmin)) return true;
        if (userFilterData && userFilterData.showAllData) return true;
        if (userFilterData && userFilterData.username) {
            const currentUsername = userFilterData.username.toLowerCase();
            const assignedMember1 = task.assignedMember1 ? task.assignedMember1.toString().toLowerCase() : "";
            const assignedMember2 = task.assignedMember2 ? task.assignedMember2.toString().toLowerCase() : "";
            return assignedMember1 === currentUsername || assignedMember2 === currentUsername;
        }
        return false;
    };

    const canUserSubmitTask = (task) => {
        if (isCompanyUser) return false;
        if (isAdminUser) return true;
        if (!userFilterData || !userFilterData.username) return false;

        const currentUsername = userFilterData.username.toLowerCase();
        const statusAE = task.status1 ? task.status1.toString().toLowerCase() : "";
        const assignedMember1 = task.assignedMember1 ? task.assignedMember1.toString().toLowerCase() : "";
        const assignedMember2 = task.assignedMember2 ? task.assignedMember2.toString().toLowerCase() : "";

        if (statusAE.includes("completed by")) return false;
        if (task.submissionDate1 && task.submissionDate2) return false;

        if (statusAE.includes("forward2")) return assignedMember2 === currentUsername;
        else if (statusAE.includes("forward1")) return assignedMember1 === currentUsername;
        else return assignedMember1 === currentUsername;
    };

    const isTaskSelectable = (task) => canUserSubmitTask(task);

    // Master sheet loading
    const loadMasterSheetData = async () => {
        if (!isCompanyUser || masterSheetData) return masterSheetData;
        setMasterSheetLoading(true);
        try {
            const masterData = await fetchMasterSheetLinkData(supabase);
            if (masterData) {
                setMasterSheetData(masterData);
                return masterData;
            }
        } catch (error) {
            console.error("Error loading Master Sheet data:", error);
        } finally {
            setMasterSheetLoading(false);
        }
        return null;
    };

    // Fetch tasks (paginated)
    const fetchTasks = async (fetchType = "both", pageNumber = 0, isLoadMore = false) => {
        if (!isLoadMore) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            let currentMasterData = masterSheetData;
            if (isCompanyUser && !currentMasterData) {
                currentMasterData = await loadMasterSheetData();
                if (!currentMasterData) {
                    throw new Error("Failed to load company mapping data");
                }
            }

            if (fetchType === "both" || fetchType === "pending") {
                const pendingRaw = await fetchTasksByType("pending", pageNumber);
                const { tasks: pendingTransformed, teamMembers1: tm1, teamMembers2: tm2 } = transformSupabaseData(pendingRaw);

                if (isLoadMore) {
                    setPendingData(prev => [...prev, ...pendingTransformed]);
                } else {
                    setPendingData(pendingTransformed);
                    setPendingPage(0);
                }
                setPendingHasMore(pendingRaw.length === PAGE_SIZE);
                if (!isLoadMore) {
                    setTeamMembers1(tm1);
                    setTeamMembers2(tm2);
                }
            }

            if (fetchType === "both" || fetchType === "completed") {
                const historyRaw = await fetchTasksByType("completed", pageNumber);
                const { tasks: historyTransformed } = transformSupabaseData(historyRaw);

                if (isLoadMore) {
                    setHistoryData(prev => [...prev, ...historyTransformed]);
                } else {
                    setHistoryData(historyTransformed);
                    setHistoryPage(0);
                }
                setHistoryHasMore(historyRaw.length === PAGE_SIZE);
            }

            if (!isLoadMore) {
                const allCurrentTasks = [...pendingData, ...historyData];
                setUniqueParties([
                    ...new Set(allCurrentTasks.map((item) => item.partyName).filter(Boolean)),
                ]);
            }
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreTasks = useCallback(async (taskType) => {
        const currentPage = taskType === "pending" ? pendingPage : historyPage;
        const nextPage = currentPage + 1;

        setLoadingMore(true);
        try {
            const rawData = await fetchTasksByType(taskType, nextPage);
            const { tasks: transformed } = transformSupabaseData(rawData);

            if (taskType === "pending") {
                setPendingData(prev => [...prev, ...transformed]);
                setPendingPage(nextPage);
                setPendingHasMore(rawData.length === PAGE_SIZE);
            } else {
                setHistoryData(prev => [...prev, ...transformed]);
                setHistoryPage(nextPage);
                setHistoryHasMore(rawData.length === PAGE_SIZE);
            }

            const newParties = transformed.map(t => t.partyName).filter(Boolean);
            setUniqueParties(prev => [...new Set([...prev, ...newParties])]);
        } catch (err) {
            console.error("Error loading more tasks:", err);
        } finally {
            setLoadingMore(false);
        }
    }, [pendingPage, historyPage]);

    // Infinite scroll observer
    const lastTaskRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        const currentType = type === "completed" ? "completed" : "pending";
        const currentHasMore = currentType === "pending" ? pendingHasMore : historyHasMore;

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && currentHasMore) {
                loadMoreTasks(currentType);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, type, pendingHasMore, historyHasMore, loadMoreTasks]);

    // Initial fetch
    useEffect(() => {
        if (userFilterData) {
            setCurrentUser(userFilterData.username || "");
            setUserRole(userFilterData.isAdmin ? "admin" : "user");
        }

        fetchTasks("both", 0, false);
        const interval = setInterval(() => fetchTasks("both", 0, false), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userFilterData, companyData?.companyName]);

    // Filtering
    const getFilteredTasks = () => {
        let tasksToFilter = [];

        if (type === "pending") {
            tasksToFilter = pendingData;
        } else if (type === "completed") {
            tasksToFilter = historyData;
        } else {
            tasksToFilter = [...pendingData, ...historyData];
        }

        if (isCompanyUser && companyData?.companyName) {
            const companyNameLower = companyData.companyName.toLowerCase().trim();
            tasksToFilter = tasksToFilter.filter((task) => {
                const taskPartyName = task.partyName ? task.partyName.toLowerCase().trim() : "";
                return taskPartyName === companyNameLower;
            });
        }

        if (!isCompanyUser && userFilterData) {
            if (userFilterData.isAdmin || userFilterData.showAllData) {
                // Show all tasks
            } else if (userFilterData.username) {
                const username = userFilterData.username.toLowerCase();
                tasksToFilter = tasksToFilter.filter((task) => {
                    const assignedMember1 = task.assignedMember1 ? task.assignedMember1.toString().toLowerCase() : "";
                    const assignedMember2 = task.assignedMember2 ? task.assignedMember2.toString().toLowerCase() : "";
                    return assignedMember1 === username || assignedMember2 === username;
                });
            }
        }

        const finalTasks = tasksToFilter.filter((task) => {
            const matchesSearch =
                task.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.descriptionOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.assignedMember1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.assignedMember2?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesPriority = !filterPriority || task.priority === filterPriority;
            const matchesStatus = !filterStatus || task.status === filterStatus;
            const matchesParty = filterParty === "all" || task.partyName === filterParty;

            return matchesSearch && matchesPriority && matchesStatus && matchesParty;
        });

        return finalTasks;
    };

    const filteredTasks = getFilteredTasks();

    // Task selection handlers
    const handleTaskSelection = (taskId) => {
        const task = filteredTasks.find((t) => t.id === taskId);
        if (!task) return;

        if (!canUserSubmitTask(task)) {
            alert("You cannot select this task as it is not assigned to you for submission or it is already completed.");
            return;
        }

        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };

    const handleSelectAll = () => {
        const selectableTasks = filteredTasks.filter((task) => canUserSubmitTask(task));
        if (selectedTasks.size === selectableTasks.length) {
            setSelectedTasks(new Set());
        } else {
            setSelectedTasks(new Set(selectableTasks.map((task) => task.id)));
        }
    };

    // Task submission
    const handleSubmitTasks = async () => {
        if (selectedTasks.size === 0) {
            alert("Please select at least one task to submit.");
            return;
        }

        const invalidTasks = [];
        for (const taskId of selectedTasks) {
            const task = filteredTasks.find((t) => t.id === taskId);
            if (!task || !canUserSubmitTask(task)) {
                invalidTasks.push(task?.taskNo || `ID:${taskId}`);
            }
        }

        if (invalidTasks.length > 0) {
            alert(`Cannot submit these tasks: ${invalidTasks.join(", ")}. They are either completed or not assigned to you.`);
            const validTaskIds = [];
            for (const taskId of selectedTasks) {
                const task = filteredTasks.find((t) => t.id === taskId);
                if (task && canUserSubmitTask(task)) {
                    validTaskIds.push(taskId);
                }
            }
            setSelectedTasks(new Set(validTaskIds));
            return;
        }

        setSubmitting(true);
        try {
            const submittingUser = getCurrentUser();
            const { results, currentDate } = await submitTasks(selectedTasks, filteredTasks, submittingUser, canUserSubmitTask);

            const failedTasks = results.filter((r) => !r.success);
            if (failedTasks.length > 0) {
                throw new Error(
                    `${failedTasks.length} tasks failed:\n` +
                    failedTasks.map((t) => `${t.taskNo}: ${t.error}`).join("\n")
                );
            }

            const completedTasks = pendingData.filter((t) => selectedTasks.has(t.id));
            const remainingPending = pendingData.filter((t) => !selectedTasks.has(t.id));

            const updatedCompletedTasks = completedTasks.map((t) => ({
                ...t,
                status1: `completed by ${submittingUser}`,
                status: "completed",
                submissionDate2: currentDate,
                actual2: "Completed",
            }));

            setPendingData(remainingPending);
            setHistoryData((prev) => [...prev, ...updatedCompletedTasks]);

            alert(`Successfully completed ${results.length} tasks`);
            setSelectedTasks(new Set());
        } catch (error) {
            console.error("Submission error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setSubmitting(false);
            fetchTasks("both", 0, false);
        }
    };

    // Forwarding
    const getAvailableMembersForForwarding = (task) => {
        if (!task) return [];
        const statusAE = task.status1 ? task.status1.toString().toLowerCase() : "";
        if (statusAE.includes("forward2")) {
            return task.assignedMember1 ? [task.assignedMember1] : [];
        } else {
            return task.assignedMember2 ? [task.assignedMember2] : [];
        }
    };

    const handleAssignTask = async (selectedMember) => {
        if (!selectedMember) {
            alert("Please select a member to forward the project.");
            return;
        }

        try {
            setForwardingInProgress(true);

            const statusAE = selectedTaskForAssign.status1
                ? selectedTaskForAssign.status1.toString().toLowerCase()
                : "";

            let newStatus;
            if (statusAE.includes("forward2")) {
                newStatus = "forward1";
            } else {
                newStatus = "forward2";
            }

            await forwardTask(selectedTaskForAssign, newStatus, GOOGLE_SHEETS_URL);

            const updateTask = (task) => ({
                ...task,
                status1: newStatus,
                status: "pending",
                submissionDate2: null,
                completedBy: null,
            });

            setPendingData((prev) =>
                prev.map((task) =>
                    task.id === selectedTaskForAssign.id ? updateTask(task) : task
                )
            );

            const targetMember =
                newStatus === "forward1"
                    ? selectedTaskForAssign.assignedMember1
                    : selectedTaskForAssign.assignedMember2;
            alert(`Task has been forwarded to ${targetMember}`);
        } catch (error) {
            console.error("Forwarding error:", error);
            alert(`Error forwarding task: ${error.message}`);
        } finally {
            setForwardingInProgress(false);
            setShowAssignPopup(false);
            setSelectedTaskForAssign(null);
            setTimeout(() => {
                fetchTasks("both", 0, false);
            }, 1000);
        }
    };

    // Render states
    if (loading || (isCompanyUser && masterSheetLoading)) {
        return <LoadingState masterSheetLoading={masterSheetLoading} />;
    }

    if (error) {
        return <ErrorState error={error} />;
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={() => fetchTasks("both", 0, false)}
                        className="flex items-center justify-center px-3 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <div className="relative">
                        <Button
                            onClick={() => setShowColumnFilter(!showColumnFilter)}
                            className="flex items-center justify-center w-full space-x-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 sm:w-auto"
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
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    {!isCompanyUser && (
                        <select
                            value={filterParty}
                            onChange={(e) => setFilterParty(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Parties</option>
                            {uniqueParties.map((party) => (
                                <option key={party} value={party}>
                                    {party}
                                </option>
                            ))}
                        </select>
                    )}
                    {!isCompanyUser && (
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Submit Button for Pending Tasks */}
            {type === "pending" && !isCompanyUser && (
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedTasks.size ===
                                        filteredTasks.filter(isTaskSelectable).length &&
                                        filteredTasks.filter(isTaskSelectable).length > 0
                                    }
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    <span className="hidden sm:inline">Select All </span>(
                                    {selectedTasks.size} of{" "}
                                    {filteredTasks.filter(isTaskSelectable).length}
                                    <span className="hidden sm:inline"> selected</span>)
                                </span>
                            </label>
                        </div>
                        <Button
                            onClick={handleSubmitTasks}
                            disabled={selectedTasks.size === 0 || submitting}
                            className={`w-full sm:w-auto ${selectedTasks.size === 0 || submitting
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                } text-white`}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center">
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    <span className="hidden sm:inline">Submitting...</span>
                                    <span className="sm:hidden">Wait...</span>
                                </span>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">
                                        Submit Selected Tasks ({selectedTasks.size})
                                    </span>
                                    <span className="sm:hidden">
                                        Submit ({selectedTasks.size})
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Tasks Table with Fixed Header and Scrollable Body */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="max-h-[70vh] overflow-auto">
                    <TaskTable
                        filteredTasks={filteredTasks}
                        filteredColumns={filteredColumns}
                        selectedTasks={selectedTasks}
                        handleTaskSelection={handleTaskSelection}
                        isTaskSelectable={isTaskSelectable}
                        isCompanyUser={isCompanyUser}
                        isAdminUser={isAdminUser}
                        type={type}
                        lastTaskRef={lastTaskRef}
                    />

                    <MobileCards
                        filteredTasks={filteredTasks}
                        filteredColumns={filteredColumns}
                        selectedTasks={selectedTasks}
                        handleTaskSelection={handleTaskSelection}
                        isTaskSelectable={isTaskSelectable}
                        isCompanyUser={isCompanyUser}
                        isAdminUser={isAdminUser}
                        type={type}
                        lastTaskRef={lastTaskRef}
                    />
                </div>

                {/* Infinite Scroll Footer */}
                {filteredTasks.length > 0 && (
                    <div className="py-8 border-t border-gray-100">
                        {loadingMore && (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-sm font-medium text-gray-600">Loading more tasks...</p>
                                <p className="text-xs text-gray-400">Please wait while we fetch the next batch</p>
                            </div>
                        )}

                        {!(type === "completed" ? historyHasMore : pendingHasMore) && (
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <div className="w-12 h-1 bg-gray-200 rounded-full mb-2"></div>
                                <p className="text-sm font-medium text-gray-500">End of List</p>
                                <p className="text-xs text-gray-400">Total {filteredTasks.length} tasks matched</p>
                            </div>
                        )}

                        {(type === "completed" ? historyHasMore : pendingHasMore) && !loadingMore && !loading && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => loadMoreTasks(type === "completed" ? "completed" : "pending")}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Load More Tasks
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Empty State */}
            {filteredTasks.length === 0 && (
                <div className="py-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                        <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No tasks found
                    </h3>
                    <p className="px-4 text-gray-500">
                        {isAdminUser
                            ? "No tasks found matching your criteria."
                            : isCompanyUser
                                ? `No tasks found for company: ${companyData.companyName}`
                                : "No tasks assigned to you match the criteria."}
                    </p>
                    <Button
                        onClick={() => fetchTasks("both", 0, false)}
                        className="mt-4 text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Refresh Data
                    </Button>
                </div>
            )}

            {/* Assignment Popup */}
            {showAssignPopup && !isCompanyUser && (
                <AssignmentPopup
                    task={selectedTaskForAssign}
                    onClose={() => setShowAssignPopup(false)}
                    onForward={handleAssignTask}
                    forwardingInProgress={forwardingInProgress}
                    getAvailableMembersForForwarding={getAvailableMembersForForwarding}
                />
            )}
        </div>
    );
}
