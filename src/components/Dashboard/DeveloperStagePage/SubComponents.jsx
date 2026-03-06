import React from "react";
import { Users, Save, Calendar, Clock as ClockIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "../shared/Button";

export const TabButton = ({ active, onClick, icon: Icon, label, count, color }) => (
  <button
    onClick={onClick}
    className={`flex-1 max-w-xs px-6 py-3 text-sm font-medium transition-colors ${active
        ? `text-${color}-600 border-b-2 border-${color}-600 bg-${color}-50`
        : "text-gray-500 hover:text-gray-700"
      }`}
  >
    <div className="flex items-center justify-center space-x-2">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span
        className={`bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded-full`}
      >
        {count}
      </span>
    </div>
  </button>
);

export const SubmissionBanner = ({ selectedCount, onSubmit, submitting }) => (
  <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-blue-800">
          {selectedCount} task(s) selected for assignment
        </span>
      </div>
      <Button
        onClick={onSubmit}
        disabled={submitting}
        className="flex items-center space-x-2 text-white bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

export const AssignmentInput = ({
  type,
  value,
  onChange,
  placeholder,
  options = [],
}) => {
  if (type === "select") {
    return (
      <select
        value={value ? value[0].toUpperCase() + value.slice(1) : ""}
        onChange={(e) =>
          onChange(e.target.value[0].toUpperCase() + e.target.value.slice(1))
        }
        className="px-2 py-1 text-sm border border-gray-300 rounded max-w-max focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select Member</option>
        {options.map((option) => (
          <option
            key={option}
            value={option[0].toUpperCase() + option.slice(1)}
          >
            {option[0].toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    );
  }

  if (type === "datetime") {
    return (
      <div className="relative">
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={(date) => onChange(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          placeholderText="Select date and time"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute flex space-x-1 transform -translate-y-1/2 right-3 top-1/2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <ClockIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
    />
  );
};
