import React from "react";
import { FileText } from "lucide-react";
import { formatDateToDDMMYY } from "../../../utils/dateFormatters";
import { getPriorityColor, getStatusBadgeClass, getStatusText } from "./SubComponents";
import ExpandableText from "../shared/ExpandableText";

export default function TaskTable({
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
        <div className="hidden lg:block">
            <table className="w-full ">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                    <tr>
                        {/* Select column */}
                        {!isCompanyUser && type === "pending" && (
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                Select
                            </th>
                        )}

                        {/* Admin assignment columns */}
                        {!isCompanyUser && isAdminUser && (
                            <>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned By
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned Member1
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned Member2
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Time Required
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Remarks
                                </th>
                            </>
                        )}

                        {/* Non-admin, non-company assignment columns */}
                        {!isCompanyUser && !isAdminUser && (
                            <>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned By
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned Member1
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Assigned Member2
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Time Required
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                    Remarks
                                </th>
                            </>
                        )}

                        {/* Common columns for all users */}
                        {filteredColumns.map(column => (
                            <th
                                key={column.key}
                                className={`px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50 ${column.key === "descriptionOfWork" ? "min-w-[300px] max-w-[400px]" : ""
                                    }`}
                            >
                                {column.label}
                            </th>
                        ))}

                        {/* Status column */}
                        {!isCompanyUser && (
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase bg-gray-50">
                                Status
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task, index) => (
                        <tr
                            key={task.id}
                            className="hover:bg-gray-50"
                            ref={index === filteredTasks.length - 1 ? lastTaskRef : null}
                        >
                            {/* Select cell */}
                            {!isCompanyUser && type === "pending" && (
                                <td className="px-4 py-3">
                                    {type === "pending" && (
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks.has(task.id)}
                                            onChange={() => handleTaskSelection(task.id)}
                                            disabled={!isTaskSelectable(task)}
                                            className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${!isTaskSelectable(task)
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                                }`}
                                        />
                                    )}
                                </td>
                            )}

                            {/* Admin assignment cells */}
                            {!isCompanyUser && isAdminUser && (
                                <>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.teamMemberName || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.assignedMember1 || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.assignedMember2 || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-900">
                                            {task.timeRequired || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block max-w-xs text-sm text-gray-900 truncate">
                                            {task.remarks || "-"}
                                        </span>
                                    </td>
                                </>
                            )}

                            {/* Non-admin, non-company assignment cells */}
                            {!isCompanyUser && !isAdminUser && (
                                <>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.teamMemberName || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.assignedMember1 || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {task.assignedMember2 || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-900">
                                            {task.timeRequired || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block max-w-xs text-sm text-gray-900">
                                            {task.remarks || "-"}
                                        </span>
                                    </td>
                                </>
                            )}

                            {/* Common cells for all users */}
                            {filteredColumns.map(column => (
                                <td
                                    key={column.key}
                                    className="px-4 py-3 text-sm text-gray-900 align-top max-w-[400px] break-words"
                                >
                                    {column.key === "linkOfSystem" && task[column.key] ? (
                                        <a
                                            href={task[column.key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 text-blue-600 hover:underline"
                                        >
                                            <span>Link</span>
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
                                    ) : [
                                        "expectedDateToClose",
                                        "givenDate",
                                        "actualDate",
                                    ].includes(column.key) ? (
                                        formatDateToDDMMYY(task[column.key])
                                    ) : ["descriptionOfWork", "notes"].includes(
                                        column.key
                                    ) ? (
                                        <div className="w-full max-w-[250px] lg:max-w-[400px] mt-1 leading-relaxed break-words whitespace-normal">
                                            <ExpandableText text={task[column.key]} />
                                        </div>
                                    ) : (
                                        task[column.key]
                                    )}
                                </td>
                            ))}

                            {/* Status cell */}
                            {!isCompanyUser && (
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(task)}`}
                                    >
                                        {getStatusText(task)}
                                    </span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
