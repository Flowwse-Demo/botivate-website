import React from "react";
import { FileText } from "lucide-react";
import { formatDateToDDMMYY } from "../../../utils/dateFormatters";
import { getStatusBadgeClass, getStatusText } from "./SubComponents";

export default function MobileCards({
    filteredTasks,
    filteredColumns,
    selectedTasks,
    handleTaskSelection,
    isTaskSelectable,
    isCompanyUser,
    isAdminUser,
    type,
    lastTaskRef,
}) {
    return (
        <div className="lg:hidden">
            <div className="p-4 space-y-4">
                {filteredTasks.map((task, index) => (
                    <div
                        key={task.id}
                        ref={index === filteredTasks.length - 1 ? lastTaskRef : null}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                        {/* Select checkbox */}
                        {!isCompanyUser && type === "pending" && (
                            <div className="flex items-center mb-3">
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.has(task.id)}
                                    onChange={() => handleTaskSelection(task.id)}
                                    disabled={!isTaskSelectable(task)}
                                    className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 ${!isTaskSelectable(task)
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                        }`}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                    Select Task
                                </span>
                            </div>
                        )}

                        {/* Status Badge */}
                        {!isCompanyUser && (
                            <div className="mb-3">
                                <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(task)}`}
                                >
                                    {getStatusText(task)}
                                </span>
                            </div>
                        )}

                        {/* Assignment Info for non-company users */}
                        {!isCompanyUser && (
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned By
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.teamMembers || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Time Required
                                    </div>
                                    <div className="text-gray-900">
                                        {task.timeRequired || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned Member1
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.assignedMember1 || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned Member2
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.assignedMember2 || "-"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Remarks for non-company users */}
                        {!isCompanyUser && task.remarks && (
                            <div className="mb-4">
                                <div className="text-xs tracking-wider text-gray-500 uppercase">
                                    Remarks
                                </div>
                                <div className="text-sm text-gray-900 break-words">
                                    {task.remarks}
                                </div>
                            </div>
                        )}

                        {/* Task Details from visibleColumns */}
                        <div className="space-y-3">
                            {filteredColumns.map((column) => (
                                <div key={column.key}>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        {column.label}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-900">
                                        {column.key === "linkOfSystem" && task[column.key] ? (
                                            <a
                                                href={task[column.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:underline"
                                            >
                                                <span>View Link</span>
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                </svg>
                                            </a>
                                        ) : column.key === "attachmentFile" &&
                                            task[column.key] ? (
                                            <a
                                                href={task[column.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 text-blue-600 transition-colors hover:text-blue-800"
                                            >
                                                <FileText className="w-4 h-4" />
                                                <span>View Attachment</span>
                                            </a>
                                        ) : column.key === "expectedDateToClose" ||
                                            column.key === "givenDate" ||
                                            column.key === "actualDate" ? (
                                            formatDateToDDMMYY(task[column.key]) || "-"
                                        ) : column.key === "descriptionOfWork" ||
                                            column.key === "notes" ? (
                                            <span className="break-words">
                                                {task[column.key] || "-"}
                                            </span>
                                        ) : (
                                            task[column.key] || "-"
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
