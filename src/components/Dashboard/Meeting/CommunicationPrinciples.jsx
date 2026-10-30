import React from "react";
import { Ear, Sparkles, CheckCheck, Send } from "lucide-react";
import { COMMUNICATION_PRINCIPLES } from "./constants";

const ICON_MAP = {
  Ear,
  Sparkles,
  CheckCheck,
  Send,
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    badge: "bg-purple-100 text-purple-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    badge: "bg-amber-100 text-amber-700",
  },
};

export default function CommunicationPrinciples() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Professional Communication Principles
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Core standards upheld by Botivate consultants in every conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {COMMUNICATION_PRINCIPLES.map((p, idx) => {
          const Icon = ICON_MAP[p.iconName] || Sparkles;
          const styling = COLOR_MAP[p.color] || COLOR_MAP.blue;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-5 border ${styling.border} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${styling.bg} ${styling.text} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${styling.badge}`}>
                    Rule 0{idx + 1}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {p.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span>Core Habit</span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

