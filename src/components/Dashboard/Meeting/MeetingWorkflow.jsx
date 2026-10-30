import React from "react";
import { ArrowRight, ArrowDown, CheckCircle2, ChevronRight, Clock, Video, FileCheck } from "lucide-react";
import { WORKFLOW_STAGES } from "./constants";

const STAGE_ICONS = {
  before: Clock,
  during: Video,
  after: FileCheck,
};

const STAGE_THEMES = {
  before: {
    accentColor: "blue",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-50 text-blue-600",
    bulletBg: "bg-blue-400",
    activeCard: "border-blue-400 ring-2 ring-blue-500/20 shadow-md",
    activeFooterText: "text-blue-600",
    topAccent: "bg-blue-500",
    flowLabel: "Stage 1: Prep",
  },
  during: {
    accentColor: "purple",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-50 text-purple-600",
    bulletBg: "bg-purple-400",
    activeCard: "border-purple-400 ring-2 ring-purple-500/20 shadow-md",
    activeFooterText: "text-purple-600",
    topAccent: "bg-purple-500",
    flowLabel: "Stage 2: Conduct",
  },
  after: {
    accentColor: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-600",
    bulletBg: "bg-emerald-400",
    activeCard: "border-emerald-400 ring-2 ring-emerald-500/20 shadow-md",
    activeFooterText: "text-emerald-600",
    topAccent: "bg-emerald-500",
    flowLabel: "Stage 3: Follow-Up",
  },
};

export default function MeetingWorkflow({ onSelectStage, activeStageTab, stageCompletions = {} }) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              3-Stage Meeting Workflow
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Lifecycle SOP
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Follow this end-to-end framework for every client consultation and review.
          </p>
        </div>

        {/* Process Flow Tracker Pills & Hint */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200/80 rounded-full px-3 py-1 text-gray-600">
            <span className="font-semibold text-blue-600">1. Prepare</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-purple-600">2. Execute</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-emerald-600">3. Follow-up</span>
          </div>

          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
            Click any stage to view checklist
          </span>
        </div>
      </div>

      {/* 3 Connected Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const Icon = STAGE_ICONS[stage.id] || Clock;
          const isSelected = activeStageTab === stage.id;
          const isCompleted = !!stageCompletions[stage.id];
          const theme = STAGE_THEMES[stage.id] || STAGE_THEMES.before;

          return (
            <div key={stage.id} className="relative flex flex-col">
              <div
                onClick={() => onSelectStage && onSelectStage(stage.id)}
                className={`group relative bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-200 cursor-pointer flex-1 flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? theme.activeCard
                    : "border-gray-200/80 shadow-xs hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Top Subtle Accent Strip for Stage Identity */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
                    isSelected ? theme.topAccent : "bg-gray-100 group-hover:bg-gray-200"
                  }`}
                />

                {/* Card Top Row: Badge & Stage Icon */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${theme.badgeBg}`}
                    >
                      <span>Stage 0{stage.stage}</span>
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      )}
                    </span>

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${theme.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Stage Title & Subtitle */}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-950 transition-colors">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mb-4">{stage.subtitle}</p>

                  {/* Instructions Bullet Points */}
                  <ul className="space-y-2 text-xs text-gray-600">
                    {stage.instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${theme.bulletBg}`} />
                        <span className="leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Card Action / Status */}
                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <span
                    className={
                      isCompleted
                        ? "text-emerald-600 font-bold flex items-center gap-1.5"
                        : isSelected
                        ? `${theme.activeFooterText} font-bold flex items-center gap-1.5`
                        : "text-gray-500 group-hover:text-gray-700"
                    }
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Stage Completed</span>
                      </>
                    ) : isSelected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        <span>Currently Viewing</span>
                      </>
                    ) : (
                      <span>View SOP Checklist</span>
                    )}
                  </span>

                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? theme.iconBg
                        : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 group-hover:translate-x-0.5"
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Desktop Workflow Connector Arrow (Aligned with Header Badges at top-8) */}
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div
                  className="hidden md:flex absolute top-8 -right-2.5 translate-x-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 pointer-events-none transition-transform hover:scale-110"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                </div>
              )}

              {/* Mobile Workflow Connector Arrow (Displayed between stacked cards) */}
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div className="md:hidden flex justify-center py-2" aria-hidden="true">
                  <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-indigo-600">
                    <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
