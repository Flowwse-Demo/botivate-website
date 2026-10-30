import React, { useState } from "react";
import { MessageSquareQuote, Copy, Check } from "lucide-react";
import { SCRIPT_CATEGORIES } from "./constants";

export default function CommunicationGuide() {
  const [selectedId, setSelectedId] = useState("opening");
  const [copied, setCopied] = useState(false);

  const activeCategory =
    SCRIPT_CATEGORIES.find((c) => c.id === selectedId) || SCRIPT_CATEGORIES[0];

  const fallbackCopy = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn("Fallback copy failed:", e);
    }
  };

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText && document.hasFocus()) {
      navigator.clipboard
        .writeText(activeCategory.script)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          fallbackCopy(activeCategory.script);
        });
    } else {
      fallbackCopy(activeCategory.script);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div>
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                What Should I Say?
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Battle-tested scripts for key conversational moments with clients.
            </p>
          </div>
        </div>

        {/* Categories selector pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SCRIPT_CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedId(cat.id);
                  setCopied(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Script Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-4 sm:p-5 border border-indigo-100/80">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-100/60">
            <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">
              {activeCategory.number}. {activeCategory.title}
            </span>
            <span className="text-[11px] font-medium text-indigo-600 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {activeCategory.purpose}
            </span>
          </div>

          {/* Script Content */}
          <div className="relative my-3">
            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed italic bg-white/70 p-3.5 rounded-xl border border-white shadow-xs">
              "{activeCategory.script}"
            </p>
          </div>
        </div>
      </div>

      {/* Footer Copy Button */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Ready to paste into chat or deliver verbally
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            copied
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Script</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
