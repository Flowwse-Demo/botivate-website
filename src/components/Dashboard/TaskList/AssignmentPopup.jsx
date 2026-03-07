import React from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    CheckCircle,
    User,
    X,
    AlertTriangle,
} from "lucide-react";

export default function AssignmentPopup({
    task,
    onClose,
    onForward,
    forwardingInProgress,
    getAvailableMembersForForwarding,
}) {
    if (!task) return null;

    const availableMembers = getAvailableMembersForForwarding(task);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 mx-4 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="px-4 py-4 border-b border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                                <ArrowRight className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                                    Forward Task
                                </h3>
                                <p className="text-xs text-gray-600 sm:text-sm">
                                    Reassign task to team member
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={forwardingInProgress}
                            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Task Details */}
                <div className="p-6 space-y-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-white border border-gray-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium text-gray-500 uppercase">
                                            Task No
                                        </span>
                                        <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded">
                                            {task?.taskNo}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            Assigned by: {task?.teamMemberName}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-700">
                                            Member 1
                                        </div>
                                        <div className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg">
                                            {task?.assignedMember1 || "Not assigned"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-700">
                                            Member 2
                                        </div>
                                        <div className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg">
                                            {task?.assignedMember2 || "Not assigned"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-700">
                                        Current Status:
                                    </span>
                                    <span
                                        className={`px-3 py-1 text-xs font-medium rounded-full ${task?.status1?.includes("forward2")
                                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                                            : task?.status1?.includes("forward1")
                                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                : "bg-gray-100 text-gray-800 border border-gray-200"
                                            }`}
                                    >
                                        {task?.status1 || "Normal"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Member Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-900">
                            Forward to Member
                        </label>

                        {availableMembers.length === 0 ? (
                            <div className="flex items-center p-4 space-x-3 text-sm border rounded-lg text-amber-800 bg-amber-50 border-amber-200">
                                <AlertTriangle className="flex-shrink-0 w-5 h-5 text-amber-500" />
                                <span>
                                    No members available for forwarding. This task needs
                                    to have both Member1 and Member2 assigned.
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value && !forwardingInProgress) {
                                            onForward(e.target.value);
                                        }
                                    }}
                                    disabled={forwardingInProgress}
                                    className="w-full px-4 py-3 text-sm font-medium transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled>
                                        {forwardingInProgress
                                            ? "Processing..."
                                            : "Choose a member to forward..."}
                                    </option>
                                    {availableMembers.map((member) => {
                                        const isCurrentAssignee =
                                            task?.status1?.includes("forward2")
                                                ? member === task?.assignedMember1
                                                : member === task?.assignedMember2;

                                        return (
                                            <option key={member} value={member}>
                                                {member}{" "}
                                                {isCurrentAssignee
                                                    ? "(Return to)"
                                                    : "(Forward to)"}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Loading State */}
                                {forwardingInProgress && (
                                    <div className="flex items-center justify-center p-4 space-x-3 border border-blue-200 rounded-lg bg-blue-50">
                                        <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                        <span className="text-sm font-medium text-blue-800">
                                            Forwarding task...
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Task will be reassigned immediately after selection
                        </div>
                        <button
                            onClick={onClose}
                            disabled={forwardingInProgress}
                            className="px-4 py-2 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {forwardingInProgress ? "Processing..." : "Cancel"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
