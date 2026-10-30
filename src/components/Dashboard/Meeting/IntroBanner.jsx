import React from "react";
import { GraduationCap, ArrowRight, Play, Sparkles, CheckCircle2 } from "lucide-react";

export default function IntroBanner({ onTakeQuiz, onWatchIntro }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl p-6 sm:p-8 lg:p-10">
      {/* Subtle, elegant dark ambient lighting (no loud rainbow gradient) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Column: Text & Actions */}
        <div className="max-w-2xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-200 mb-4 shadow-xs">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Meeting Training Program</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span className="text-slate-400 font-normal">Internal SOP v2.4</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            Master Every Client Meeting
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-xl">
            Learn how to prepare, communicate and follow up professionally in client meetings. This guide will help you build confidence, understand client requirements, and ensure successful outcomes.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onTakeQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Take Practice Quiz</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>

            <button
              type="button"
              onClick={onWatchIntro}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-current text-slate-200 ml-0.5" />
              </div>
              <span>Watch Introduction</span>
            </button>
          </div>
        </div>

        {/* Right Column: Professional Meeting Graphic / UI Mockup */}
        <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md flex-shrink-0 flex items-center justify-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-slate-950/80 border border-slate-800 p-4 shadow-2xl flex flex-col justify-between backdrop-blur-md">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-medium text-slate-400">Client Meeting Room</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live SOP
              </span>
            </div>

            {/* Illustration Canvas: Video Tiles */}
            <div className="grid grid-cols-2 gap-2.5 my-2">
              {/* Screen card 1: Host / Employee */}
              <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col items-center justify-center text-center">
                <div className="relative w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center mb-2 shadow-inner">
                  <span className="text-xs font-bold text-indigo-400">YOU</span>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <span className="text-[11px] font-semibold text-white">Meeting Lead</span>
                <span className="text-[9px] text-slate-400">Speaking clearly • Agenda</span>
              </div>

              {/* Screen card 2: Client */}
              <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col items-center justify-center text-center">
                <div className="relative w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-2 shadow-inner">
                  <span className="text-xs font-bold text-slate-300">CL</span>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <span className="text-[11px] font-semibold text-white">Client Partner</span>
                <span className="text-[9px] text-slate-400">Sharing Requirements</span>
              </div>
            </div>

            {/* Mini status footer */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3 Stages Covered</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-semibold text-[10px]">
                <Sparkles className="w-3 h-3" />
                <span className="text-amber-300">SOP Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
