import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { QUIZ_QUESTIONS } from "./quizData";

export default function PracticeQuiz({ onQuizCompleted, currentQuizState }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        score += 1;
      }
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const result = {
      attempted: true,
      score,
      total: totalQuestions,
      percentage,
      answers: selectedAnswers,
      completedAt: new Date().toISOString(),
    };

    setIsSubmitted(true);
    if (onQuizCompleted) {
      onQuizCompleted(result);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setShowReview(false);
  };

  // Calculate current score if submitted
  const score = QUIZ_QUESTIONS.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div id="meeting-practice-quiz" className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Interactive Practice Quiz
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Test your understanding of Botivate's 3-stage meeting SOP and communication standards.
          </p>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-gray-600">
              Answered: {answeredCount} / {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {!isSubmitted ? (
        /* Quiz Active Screen */
        <div>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-gray-600">
              <span className="font-bold text-purple-700">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-gray-400">{currentQ.category}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Box */}
          <div className="mb-6">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
              Topic: {currentQ.category}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
              {currentQ.question}
            </h4>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 font-medium"
                      : "bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300 text-gray-400 bg-white"
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Completion Screen */
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Award className="w-8 h-8" />
          </div>

          <h4 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">
            {percentage >= 80
              ? "🎉 Outstanding! You Passed!"
              : percentage >= 50
              ? "Good Effort! Keep Refining."
              : "Review the SOP and Try Again"}
          </h4>

          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
            {percentage >= 80
              ? "You demonstrated strong mastery of client meeting preparation, communication rules, and post-meeting documentation."
              : "Review the answers and explanations below to strengthen your client meeting communication protocol."}
          </p>

          {/* Score Card */}
          <div className="max-w-xs mx-auto bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">
                  {score} / {totalQuestions}
                </span>
                <span className="text-xs font-bold text-purple-600 block">
                  Score: {percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setShowReview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showReview ? "Hide Answer Review" : "Review All Answers"}</span>
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
          </div>

          {/* Question-by-Question Review */}
          {showReview && (
            <div className="text-left mt-8 pt-6 border-t border-gray-200 space-y-5">
              <h5 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                Detailed Answers & Explanations:
              </h5>
              {QUIZ_QUESTIONS.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-xl border ${
                      isCorrect
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-rose-50/50 border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                        {idx + 1}. {q.question}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full flex-shrink-0">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="text-sm sm:text-[15px] space-y-2 mb-3 leading-relaxed">
                      <p className="text-gray-800">
                        <span className="font-semibold text-gray-900">Your Answer: </span>
                        <span>
                          {userAns !== undefined
                            ? q.options[userAns]
                            : "(No answer selected)"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-700 font-medium">
                          <span className="font-bold text-emerald-800">Correct Answer: </span>
                          <span>{q.options[q.correctAnswer]}</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-white/80 p-3 rounded-lg border border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      <span className="font-bold text-indigo-700">SOP Rationale: </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

