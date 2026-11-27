"use client";
import { useState, useEffect, useCallback } from "react";
import { Server, PlusCircle, RefreshCw, Clock } from "lucide-react";
import TaskList from "../TaskList";
import supabase from "../../../supabaseClient";
import { fetchSystems } from "../../../services/schemaApi";

const INITIAL_STATS = { totalSystems: 0, newSystem: 0, updated: 0, pending: 0 };

export default function CompanyTasksPage({ userRole, userFilterData, companyData, onRefreshStats }) {
  const [activeFilter, setActiveFilter] = useState("pending");
  const [stats, setStats] = useState(INITIAL_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  const companyId = companyData?.companyId ?? null;

  const loadStats = useCallback(async () => {
    if (companyId == null) {
      setStats(INITIAL_STATS);
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const [systems, { data: taskRows, error }] = await Promise.all([
        fetchSystems(companyId),
        supabase
          .from("user_tasks")
          .select("type_of_work, status")
          .eq("company_id", companyId),
      ]);
      if (error) throw error;

      const tasks = (taskRows || []).filter(
        (t) => (t.status || "").toString().toLowerCase() !== "cancelled"
      );
      const norm = (v) => (v || "").toString().toLowerCase();

      setStats({
        totalSystems: (systems || []).length,
        newSystem: tasks.filter((t) => norm(t.type_of_work).startsWith("new system")).length,
        updated: tasks.filter((t) => norm(t.type_of_work).includes("existing system")).length,
        pending: tasks.filter((t) => norm(t.status) !== "completed").length,
      });
    } catch (e) {
      console.error("Error loading task overview stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Refresh stats whenever TaskList asks parent to refresh (e.g. after a task update)
  const handleRefreshStats = () => {
    loadStats();
    if (typeof onRefreshStats === "function") onRefreshStats();
  };

  const cards = [
    { key: "totalSystems", label: "Total Systems", value: stats.totalSystems, Icon: Server, tone: "from-indigo-500 to-violet-500", text: "text-indigo-600", bg: "bg-indigo-50" },
    { key: "newSystem", label: "New System", value: stats.newSystem, Icon: PlusCircle, tone: "from-emerald-500 to-teal-500", text: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "updated", label: "Updated", value: stats.updated, Icon: RefreshCw, tone: "from-sky-500 to-blue-500", text: "text-sky-600", bg: "bg-sky-50" },
    { key: "pending", label: "Pendings", value: stats.pending, Icon: Clock, tone: "from-amber-500 to-orange-500", text: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 px-1">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">View and track your pending and completed tasks</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(({ key, label, value, Icon, tone, text, bg }) => (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tone} opacity-80`} />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                <p className={`mt-1 text-2xl sm:text-3xl font-extrabold ${text}`}>
                  {statsLoading ? <span className="text-gray-300">—</span> : value}
                </p>
              </div>
              <div className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveFilter("pending")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveFilter("completed")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === "completed"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Completed
        </button>
      </div>

      <TaskList
        key={activeFilter}
        type={activeFilter}
        userRole={userRole}
        userFilterData={userFilterData}
        companyData={companyData}
        onRefreshStats={handleRefreshStats}
      />
    </div>
  );
}
