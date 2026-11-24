"use client";
import { useState } from "react";
import TaskList from "../TaskList";

export default function CompanyTasksPage({ userRole, userFilterData, companyData, onRefreshStats }) {
  const [activeFilter, setActiveFilter] = useState("pending");

  return (
    <div className="space-y-6 px-1">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">View and track your pending and completed tasks</p>
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
        onRefreshStats={onRefreshStats}
      />
    </div>
  );
}
