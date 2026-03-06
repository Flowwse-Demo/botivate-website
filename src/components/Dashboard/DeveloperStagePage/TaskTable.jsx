import React from "react";
import { AssignmentInput } from "./SubComponents";

export default function TaskTable({
  displayedTasks,
  activeTab,
  selectedTasks,
  handleCheckboxChange,
  assignmentForm,
  handleAssignmentFormChange,
  teamMembers1,
  teamMembers2,
  visibleColumns,
  TABLE_COLUMNS,
}) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            <tr>
              {/* Only show Select column for pending tab */}
              {activeTab === "pending" && (
                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                  Select
                </th>
              )}
              {activeTab === "pending" && (
                <>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Assign Member1
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Assign Member2
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Time Required
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Remarks
                  </th>
                </>
              )}
              {activeTab === "history" && (
                <>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Assigned Member1
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Assigned Member2
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Time Required
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Remarks
                  </th>
                </>
              )}
              {TABLE_COLUMNS.filter((col) => visibleColumns[col.key]).map(
                (column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase ${column.key === "descriptionOfWork"
                        ? "min-w-[300px] max-w-[400px]"
                        : ""
                      }`}
                  >
                    {column.label}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                {/* Checkbox - Only for pending tab */}
                {activeTab === "pending" && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) =>
                        handleCheckboxChange(task.id, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                )}

                {activeTab === "pending" && (
                  <>
                    <td className="px-4 py-3">
                      {selectedTasks.has(task.id) ? (
                        <AssignmentInput
                          type="select"
                          value={assignmentForm[task.id]?.assignedMember1 || ""}
                          onChange={(value) =>
                            handleAssignmentFormChange(
                              task.id,
                              "assignedMember1",
                              value
                            )
                          }
                          options={teamMembers1}
                        />
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {selectedTasks.has(task.id) ? (
                        <AssignmentInput
                          type="select"
                          value={assignmentForm[task.id]?.assignedMember2 || ""}
                          onChange={(value) =>
                            handleAssignmentFormChange(
                              task.id,
                              "assignedMember2",
                              value
                            )
                          }
                          options={teamMembers2}
                        />
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {selectedTasks.has(task.id) ? (
                        <input
                          type="datetime-local"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          value={assignmentForm[task.id]?.dateTime || ""}
                          onChange={(e) =>
                            handleAssignmentFormChange(
                              task.id,
                              "dateTime",
                              e.target.value
                            )
                          }
                          placeholder="dd-mm-yyyy --:--"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {selectedTasks.has(task.id) ? (
                        <AssignmentInput
                          type="text"
                          value={assignmentForm[task.id]?.remarks || ""}
                          onChange={(value) =>
                            handleAssignmentFormChange(task.id, "remarks", value)
                          }
                          placeholder="Add remarks"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </>
                )}

                {activeTab === "history" && (
                  <>
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

                {TABLE_COLUMNS.filter((col) => visibleColumns[col.key]).map(
                  (column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-sm text-gray-900 ${column.key === "descriptionOfWork"
                          ? "min-w-[300px] max-w-[400px]"
                          : ""
                        }`}
                    >
                      {column.key === "linkOfSystem" && task[column.key] ? (
                        <a
                          href={task[column.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Link
                        </a>
                      ) : column.key === "attachmentFile" &&
                        task[column.key] ? (
                        <a
                          href={task[column.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          File
                        </a>
                      ) : column.key === "descriptionOfWork" ||
                        column.key === "notes" ? (
                        <div className="leading-relaxed break-words whitespace-normal">
                          {task[column.key]}
                        </div>
                      ) : (
                        task[column.key]
                      )}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              {/* Checkbox for pending tab */}
              {activeTab === "pending" && (
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={(e) =>
                      handleCheckboxChange(task.id, e.target.checked)
                    }
                    className="w-4 h-4 mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Select for Assignment
                  </span>
                </div>
              )}

              {/* Task Details from TABLE_COLUMNS */}
              <div className="mb-4 space-y-3">
                {TABLE_COLUMNS.filter((col) => visibleColumns[col.key]).map(
                  (column) => (
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
                            className="text-blue-600 hover:underline"
                          >
                            View Link
                          </a>
                        ) : column.key === "attachmentFile" &&
                          task[column.key] ? (
                          <a
                            href={task[column.key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View File
                          </a>
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
                  )
                )}
              </div>

              {/* Assignment Section for Pending Tab */}
              {activeTab === "pending" && selectedTasks.has(task.id) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-3 text-xs tracking-wider text-gray-500 uppercase">
                    Assignment Details
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs tracking-wider text-gray-500 uppercase">
                        Assign Member 1
                      </label>
                      <AssignmentInput
                        type="select"
                        value={assignmentForm[task.id]?.assignedMember1 || ""}
                        onChange={(value) =>
                          handleAssignmentFormChange(
                            task.id,
                            "assignedMember1",
                            value
                          )
                        }
                        options={teamMembers1}
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider text-gray-500 uppercase">
                        Assign Member 2
                      </label>
                      <AssignmentInput
                        type="select"
                        value={assignmentForm[task.id]?.assignedMember2 || ""}
                        onChange={(value) =>
                          handleAssignmentFormChange(
                            task.id,
                            "assignedMember2",
                            value
                          )
                        }
                        options={teamMembers2}
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider text-gray-500 uppercase">
                        Time Required
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        value={assignmentForm[task.id]?.dateTime || ""}
                        onChange={(e) =>
                          handleAssignmentFormChange(
                            task.id,
                            "dateTime",
                            e.target.value
                          )
                        }
                        placeholder="dd-mm-yyyy --:--"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider text-gray-500 uppercase">
                        Remarks
                      </label>
                      <AssignmentInput
                        type="text"
                        value={assignmentForm[task.id]?.remarks || ""}
                        onChange={(value) =>
                          handleAssignmentFormChange(task.id, "remarks", value)
                        }
                        placeholder="Add remarks"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Display for History Tab */}
              {activeTab === "history" && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-3 text-xs tracking-wider text-gray-500 uppercase">
                    Assignment Details
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs tracking-wider text-gray-500 uppercase">
                        Member 1
                      </div>
                      <div className="font-medium text-gray-900">
                        {task.assignedMember1 || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs tracking-wider text-gray-500 uppercase">
                        Member 2
                      </div>
                      <div className="font-medium text-gray-900">
                        {task.assignedMember2 || "-"}
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
                        Remarks
                      </div>
                      <div className="text-gray-900 break-words">
                        {task.remarks || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
