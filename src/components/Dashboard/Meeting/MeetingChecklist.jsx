import React, { useState } from "react";
import { Check, CheckCircle2, AlertCircle, Sparkles, RotateCcw } from "lucide-react";
import { CHECKLIST_ITEMS, WORKFLOW_STAGES } from "./constants";

export default function MeetingChecklist({
  activeStageTab = "before",
  setActiveStageTab,
  checklistState = {},
  onToggleItem,
  stageCompletions = {},
  onMarkStageComplete,
  onResetStage,
}) {
  const [feedback, setFeedback] = useState(null);

  const currentItems = CHECKLIST_ITEMS[activeStageTab] || [];
  const currentStageChecked = checklistState[activeStageTab] || {};
  const completedCount = currentItems.filter((item) => currentStageChecked[item.id]).length;
  const totalCount = currentItems.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isStageFullyComplete = !!stageCompletions[activeStageTab];

  const handleMarkComplete = () => {
    if (completedCount < totalCount) {
      const remaining = totalCount - completedCount;
      setFeedback({
        type: "warning",
        message: `Please complete all 6 checklist items before marking this stage complete (${remaining} item${remaining > 1 ? "s" : ""} remaining).`,
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    onMarkStageComplete(activeStageTab);
    setFeedback({
      type: "success",
      message: `🎉 Great job! The ${activeStageTab === "before" ? "Before Meeting" : activeStageTab === "during" ? "During Meeting" : "After Meeting"} stage is now marked as complete!`,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleReset = () => {
    onResetStage(activeStageTab);
    setFeedback({
      type: "info",
      message: "Checklist reset for this stage.",
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Meeting SOP Checklist
              </h3>
              {isStageFullyComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Stage Learned
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify each mandatory action before moving forward.
            </p>
          </div>

          {/* Reset button */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 self-start sm:self-auto cursor-pointer"
              title="Reset checklist for this stage"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Stage Tabs */}
        <div className="flex items-center p-1 bg-gray-100/80 rounded-xl mb-5 overflow-x-auto">
          {WORKFLOW_STAGES.map((s) => {
            const isActive = activeStageTab === s.id;
            const isDone = !!stageCompletions[s.id];
            const sCheckedCount = (CHECKLIST_ITEMS[s.id] || []).filter(
              (i) => (checklistState[s.id] || {})[i.id]
            ).length;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveStageTab(s.id);
                  setFeedback(null);
                }}
                className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{s.title}</span>
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                ) : (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {sCheckedCount}/6
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress summary bar */}
        <div className="mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">
              Stage Progress: <span className="text-indigo-600">{completedCount} of {totalCount} items</span>
            </span>
            <span className="font-bold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                percentage === 100 ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Feedback Alert if present */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border transition-all duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : feedback.type === "warning"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : feedback.type === "warning" ? (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Checklist items */}
        <div className="space-y-2.5">
          {currentItems.map((item, index) => {
            const isChecked = !!currentStageChecked[item.id];

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(activeStageTab, item.id)}
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? "bg-indigo-50/40 border-indigo-200/80 text-gray-800"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 text-gray-700"
                }`}
              >
                {/* Custom Checkbox */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 transition-colors ${
                    isChecked
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-gray-300 bg-white group-hover:border-indigo-400"
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 text-xs sm:text-sm leading-relaxed select-none">
                  <span className="font-semibold text-gray-400 mr-2">
                    0{index + 1}.
                  </span>
                  <span className={isChecked ? "line-through text-gray-400 font-normal" : "font-medium"}>
                    {item.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">
          {completedCount === totalCount
            ? "✓ Ready to complete"
            : `${totalCount - completedCount} items remaining`}
        </span>

        <button
          type="button"
          onClick={handleMarkComplete}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
            completedCount === totalCount
              ? isStageFullyComplete
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isStageFullyComplete
              ? "Re-validate Stage"
              : "Mark Stage Complete"}
          </span>
        </button>
      </div>
    </div>
  );
}

