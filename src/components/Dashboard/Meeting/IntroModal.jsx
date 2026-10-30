import React, { useState } from "react";
import { X, Play, Pause, CheckCircle2, Clock, Video, FileText, Sparkles, Volume2 } from "lucide-react";

export default function IntroModal({ isOpen, onClose, onStartQuiz }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 sm:p-6 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-white mb-1.5">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>SOP Orientation Video & Guide</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Introduction to Client Meeting Excellence
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-5 pt-2 bg-gray-50/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Video Briefing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === "timeline"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Meeting Timeline Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === "tips"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Audio & Screen Rules
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "overview" && (
            <div>
              {/* Simulated Video Player */}
              <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex flex-col justify-between p-4 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[11px] font-semibold text-white/70 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    Botivate SOP Orientation • 4:20 mins
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>

                {/* Center Play Button Graphic */}
                <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer mb-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white ml-1" />
                    )}
                  </button>
                  <p className="text-xs text-slate-300 font-medium">
                    {isPlaying
                      ? "Playing: Mastering the 3 Stages of Client Meetings"
                      : "Click to play introduction video summary"}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="z-10">
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`bg-indigo-400 h-1 rounded-full ${
                        isPlaying ? "w-2/3 animate-pulse" : "w-1/4"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{isPlaying ? "02:45" : "01:05"}</span>
                    <span>04:20</span>
                  </div>
                </div>

                {/* Subtle background glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/60 pointer-events-none" />
              </div>

              <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 space-y-2">
                <p className="font-bold text-blue-900">Key Takeaways from the Video:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-900/80">
                  <li>Preparation is 70% of a meeting's success: always review past notes and client history.</li>
                  <li>Active listening builds trust faster than premature solutions.</li>
                  <li>A meeting without a shared Minutes of Meeting (MOM) within 24 hours is incomplete.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  -10m
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Pre-Meeting Stage (10 mins before)</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Test microphone, open presentation slides, review client name and agenda points, ensure a quiet professional background.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  LIVE
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">During Meeting (30-45 mins)</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Start on time, welcome attendees, state the objective, listen actively, take structured notes, confirm decisions and assign owners before closing.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  +24h
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Post-Meeting Stage (Within 24 hours)</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Draft MOM using the standard Botivate template, verify action item deadlines, send to client stakeholders, and update task management boards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tips" && (
            <div className="space-y-3 text-xs text-gray-700">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="font-bold text-gray-900 block mb-1">🎙️ Microphone Etiquette:</span>
                Stay muted when others are presenting. Use headphones to prevent echo and verify your input device is recognized before joining.
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="font-bold text-gray-900 block mb-1">🖥️ Screen Sharing Hygiene:</span>
                Close personal tabs, disable notification popups, zoom in to 110-125% for readability, and share only the specific window needed.
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="font-bold text-gray-900 block mb-1">📝 Live Note Taking:</span>
                Never rely on memory. Jot down verbatim numbers, dates, and explicit stakeholder requests as they are voiced.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Close Guide
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartQuiz) onStartQuiz();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Proceed to Practice Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

