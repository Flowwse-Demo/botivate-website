import React from "react";
import { Layers, CheckCircle2, FileText, Award, ArrowUpRight } from "lucide-react";

export default function OverviewCards({
  stagesLearnedCount = 0,
  totalStages = 3,
  quizState = { attempted: false, score: 0, total: 10, percentage: 0 },
  onViewMOMTemplate,
  onTakeQuiz,
}) {
  const learnedPercent = Math.round((stagesLearnedCount / totalStages) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Meeting Stages */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workflow
            </span>
            <h3 className="text-sm font-medium text-gray-700 mt-0.5">Meeting Stages</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">03</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Full Lifecycle
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Before, During, After</p>
        </div>
      </div>

      {/* Card 2: Stages Learned */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Training Status
            </span>
            <h3 className="text-sm font-medium text-gray-700 mt-0.5">Stages Learned</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              0{stagesLearnedCount}
            </span>
            <span className="text-sm font-medium text-gray-400">/ 0{totalStages}</span>
            <span
              className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                stagesLearnedCount === totalStages
                  ? "bg-emerald-100 text-emerald-700"
                  : stagesLearnedCount > 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {learnedPercent}% Done
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${learnedPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {stagesLearnedCount === totalStages
              ? "All checklists mastered"
              : `${totalStages - stagesLearnedCount} stage(s) remaining`}
          </p>
        </div>
      </div>

      {/* Card 3: MOM Template */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Standard Format
            </span>
            <h3 className="text-sm font-medium text-gray-700 mt-0.5">MOM Template</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">01</span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                Standard Ready
              </span>
            </div>
            <button
              type="button"
              onClick={onViewMOMTemplate}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Reusable structure with 9 fields</p>
        </div>
      </div>

      {/* Card 4: Quiz Progress */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Assessment
            </span>
            <h3 className="text-sm font-medium text-gray-700 mt-0.5">Quiz Progress</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          {quizState.attempted ? (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {quizState.percentage}%
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    ({quizState.score}/{quizState.total})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onTakeQuiz}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                >
                  <span>Review</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-purple-600 font-semibold mt-1">
                {quizState.percentage >= 80 ? "SOP Certified" : "Attempt Complete"}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-700">Not Attempted</span>
                <button
                  type="button"
                  onClick={onTakeQuiz}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                >
                  <span>Start</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">10 questions to test SOP readiness</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

