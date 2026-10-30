import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { MOM_TEMPLATE_TEXT } from "./constants";

export default function MOMTemplateCard() {
  const [copied, setCopied] = useState(false);

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
      console.warn("Fallback MOM copy failed:", e);
    }
  };

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText && document.hasFocus()) {
      navigator.clipboard
        .writeText(MOM_TEMPLATE_TEXT)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          fallbackCopy(MOM_TEMPLATE_TEXT);
        });
    } else {
      fallbackCopy(MOM_TEMPLATE_TEXT);
    }
  };

  const fields = [
    { label: "Client / Company", placeholder: "[Client Name]" },
    { label: "Date & Time", placeholder: "[DD MMM YYYY, HH:MM \u2013 HH:MM]" },
    { label: "Attendees", placeholder: "[Name 1, Name 2, ...]" },
    { label: "Meeting Objective", placeholder: "[Brief objective of the meeting]" },
    { label: "Discussion Summary", placeholder: "[Key points discussed]" },
    { label: "Decisions", placeholder: "[Final decisions taken]" },
    { label: "Action Items", placeholder: "[Task, Owner, Due Date]" },
    { label: "Next Meeting", placeholder: "[Date & Purpose]" },
  ];

  return (
    <div
      id="mom-template-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm"
    >
      {/* Header: Google Docs style Blue Doc Icon + Title */}
      <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
            fill="#2563EB"
          />
          <path d="M14 2V8H20L14 2Z" fill="#93C5FD" />
          <rect x="7.5" y="11" width="9" height="1.8" rx="0.9" fill="white" />
          <rect x="7.5" y="14.5" width="9" height="1.8" rx="0.9" fill="white" />
          <rect x="7.5" y="18" width="6" height="1.8" rx="0.9" fill="white" />
        </svg>
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          Minutes of Meeting (MOM)
        </h3>
      </div>

      {/* Light Blue Rounded Container from Reference Image 1 */}
      <div className="bg-[#f0f5fc] border border-[#e1ecfb] rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: 8 Key-Value Rows with vertically aligned colons */}
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 sm:gap-x-5 gap-y-2 text-xs sm:text-[13.5px]">
          {fields.map((f, i) => (
            <React.Fragment key={i}>
              <span className="font-bold text-slate-700 whitespace-nowrap">
                {f.label}
              </span>
              <span className="text-slate-400 font-semibold select-none">:</span>
              <span className="text-slate-500 font-medium break-words">
                {f.placeholder}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Right Side: Copy MOM Template Button */}
        <div className="flex-shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-2.5 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
              copied
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-[#e6effe] hover:bg-[#dbe7fd] text-[#2563eb] border border-blue-200/50"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Template Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#2563eb]" />
                <span>Copy MOM Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
