import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Calendar, User, Building, Paperclip, AlertCircle, FileText, Link } from "lucide-react";
import Button from "../../ui/Button";

export default function AdminForm({
  formData,
  setFormData,
  handleInputChange,
  errors,
  postedByOptions,
  partyNames,
  workTypes,
  systemNames,
  isLoadingDropdowns,
  isLoadingSystemNames,
  handleFileChange,
  handleSubmit,
  isSubmitting,
  uploadProgress,
  additionalTasks,
  addAdditionalTask,
  removeAdditionalTask,
  updateAdditionalTask,
  handleShowAdditionalSection
}) {

  const renderTaskForm = (task, index, isMain = false) => (
    <div
      key={isMain ? "main" : task.id}
      className={`${isMain
          ? ""
          : "bg-gray-50 border border-gray-200 rounded-lg p-6 relative"
        }`}
    >
      {!isMain && (
        <button
          type="button"
          onClick={() => removeAdditionalTask(task.id)}
          className="absolute text-red-500 transition-colors top-4 right-4 hover:text-red-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className={`${!isMain ? "pr-8" : ""}`}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Type of Work */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Type of Work {isMain && <span className="text-red-500">*</span>}
            </label>
            {(isMain ? formData.isTypeOfWorkInput : task.isTypeOfWorkInput) ? (
              <input
                type="text"
                name={isMain ? "typeOfWork" : ""}
                value={isMain ? formData.typeOfWork : task.typeOfWork}
                onChange={(e) =>
                  isMain
                    ? handleInputChange(e)
                    : updateAdditionalTask(task.id, "typeOfWork", e.target.value)
                }
                placeholder="Enter Type of Work"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.typeOfWork
                    ? "border-red-300"
                    : "border-gray-300"
                  }`}
              />
            ) : (
              <select
                name={isMain ? "typeOfWork" : ""}
                value={isMain ? formData.typeOfWork : task.typeOfWork}
                onChange={(e) =>
                  isMain
                    ? handleInputChange(e)
                    : updateAdditionalTask(task.id, "typeOfWork", e.target.value)
                }
                disabled={isLoadingDropdowns}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.typeOfWork
                    ? "border-red-300"
                    : "border-gray-300"
                  } ${isLoadingDropdowns ? "bg-gray-100" : ""}`}
              >
                <option value="">
                  {isLoadingDropdowns ? "Loading..." : "Select Type of Work"}
                </option>
                {workTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
            {isMain && errors.typeOfWork && (
              <p className="mt-1 text-sm text-red-600">{errors.typeOfWork}</p>
            )}
          </div>

          {/* System Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              System Name
            </label>

            <input
              list="systemNamesList"
              name={isMain ? "systemName" : ""}
              value={isMain ? formData.systemName : task.systemName}
              onChange={(e) =>
                isMain
                  ? handleInputChange(e)
                  : updateAdditionalTask(task.id, "systemName", e.target.value)
              }
              placeholder={
                isLoadingSystemNames
                  ? "Loading systems..."
                  : systemNames.length === 0
                    ? "Enter System Name"
                    : "Select or Enter System Name"
              }
              disabled={isLoadingSystemNames}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.systemName
                  ? "border-red-300"
                  : "border-gray-300"
                } ${isLoadingSystemNames ? "bg-gray-100" : ""}`}
            />

            <datalist id="systemNamesList">
              {systemNames.map((system) => (
                <option key={system} value={system} />
              ))}
            </datalist>

            {isMain && errors.systemName && (
              <p className="mt-1 text-sm text-red-600">{errors.systemName}</p>
            )}
          </div>

          {/* Link of System */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Link of System
            </label>
            <div className="relative">
              <Link className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="url"
                name={isMain ? "link" : ""}
                value={isMain ? formData.link : task.link}
                onChange={(e) =>
                  isMain
                    ? handleInputChange(e)
                    : updateAdditionalTask(task.id, "link", e.target.value)
                }
                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Priority in Customer
            </label>
            <div className="relative">
              <AlertCircle className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <select
                name={isMain ? "priority" : ""}
                value={isMain ? formData.priority : task.priority}
                onChange={(e) =>
                  isMain
                    ? handleInputChange(e)
                    : updateAdditionalTask(task.id, "priority", e.target.value)
                }
                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Expected Date */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Expected Date to Close{" "}
              {isMain && <span className="text-red-500">*</span>}
            </label>
            <div className="relative max-w-md">
              <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="date"
                name={isMain ? "expectedDate" : ""}
                value={isMain ? formData.expectedDate : task.expectedDate}
                onChange={(e) =>
                  isMain
                    ? handleInputChange(e)
                    : updateAdditionalTask(task.id, "expectedDate", e.target.value)
                }
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.expectedDate
                    ? "border-red-300"
                    : "border-gray-300"
                  }`}
              />
            </div>
            {isMain && errors.expectedDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedDate}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Description Of Work{" "}
            {isMain && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <FileText className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
            <textarea
              name={isMain ? "description" : ""}
              value={isMain ? formData.description : task.description}
              onChange={(e) =>
                isMain
                  ? handleInputChange(e)
                  : updateAdditionalTask(task.id, "description", e.target.value)
              }
              rows={4}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.description
                  ? "border-red-300"
                  : "border-gray-300"
                }`}
              placeholder="Describe the work to be done..."
            />
          </div>
          {isMain && errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name={isMain ? "notes" : ""}
            value={isMain ? formData.notes : task.notes}
            onChange={(e) =>
              isMain
                ? handleInputChange(e)
                : updateAdditionalTask(task.id, "notes", e.target.value)
            }
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional notes or comments..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 shadow-sm rounded-xl"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Assign New Task
              </h2>
              <p className="text-gray-600">
                Create and assign tasks to team members
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-3 space-y-6 sm:p-6 sm:space-y-8"
        >
          {/* Main Form Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
            {/* Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.date ? "border-red-300" : "border-gray-300"
                    }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Posted By */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Posted By <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <select
                  name="postedBy"
                  value={formData.postedBy}
                  onChange={handleInputChange}
                  disabled={isLoadingDropdowns}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">
                    {isLoadingDropdowns ? "Loading..." : "Select Posted By"}
                  </option>

                  {postedByOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {errors.postedBy && (
                <p className="mt-1 text-sm text-red-600">{errors.postedBy}</p>
              )}
            </div>

            {/* Taken From */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Taken From <span className="text-red-500">*</span>
              </label>

              {formData.isTakenFromInput ? (
                // 🔹 Custom Input
                <input
                  type="text"
                  name="takenFrom"
                  value={formData.takenFrom || ""}
                  onChange={handleInputChange}
                  placeholder="Enter Taken From"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors?.takenFrom ? "border-red-300" : "border-gray-300"
                    }`}
                  onBlur={() =>
                    !formData.takenFrom &&
                    setFormData((prev) => ({
                      ...prev,
                      isTakenFromInput: false,
                    }))
                  }
                />
              ) : (
                // 🔹 Dropdown
                <select
                  name="takenFrom"
                  value={formData.takenFrom}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setFormData((prev) => ({
                        ...prev,
                        takenFrom: "",
                        isTakenFromInput: true,
                      }));
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  disabled={isLoadingDropdowns}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {isLoadingDropdowns ? "Loading..." : "Select Taken From"}
                  </option>
                  {postedByOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="custom">Other (Enter manually)</option>
                </select>
              )}

              {/* Error Message */}
              {errors?.takenFrom && (
                <p className="mt-1 text-sm text-red-600">{errors.takenFrom}</p>
              )}
            </div>

            {/* Party Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Party Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />

                <input
                  type="text"
                  list="partyNameList"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  disabled={isLoadingDropdowns}
                  placeholder={
                    isLoadingDropdowns
                      ? "Loading..."
                      : "Select or Search Party Name"
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base 
        ${errors.partyName ? "border-red-300" : "border-gray-300"} 
        ${isLoadingDropdowns ? "bg-gray-100" : ""}`}
                />

                <datalist id="partyNameList">
                  {partyNames.map((party) => (
                    <option key={party} value={party} />
                  ))}
                </datalist>
              </div>

              {errors.partyName && (
                <p className="mt-1 text-sm text-red-600">{errors.partyName}</p>
              )}
            </div>

            {/* Attachment */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Attachment File
                <span className="block ml-2 text-xs text-gray-500 sm:inline">
                  (Max 10MB - Images, PDF, Word, Excel, Text files)
                </span>
              </label>
              <div className="relative">
                <Paperclip className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="w-full py-3 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base"
                />
              </div>
              {formData.attachment && (
                <p className="mt-2 text-sm text-green-600 break-all">
                  ✓ Selected: {formData.attachment.name} (
                  {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {/* Main Task Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Primary Task Details
              </h3>
            </div>
            {renderTaskForm(formData, 0, true)}
          </div>

          {/* Additional Tasks Section */}
          <AnimatePresence>
            {additionalTasks.length > 0 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Tasks
                  </h3>
                </div>
                {additionalTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {renderTaskForm(task, index + 1)}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          {isSubmitting && uploadProgress && (
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 -ml-1 text-blue-500 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm text-blue-700 sm:text-base">
                  {uploadProgress}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-stretch justify-between gap-4 pt-6 border-t border-gray-200 sm:flex-row sm:items-center">
            <div className="order-2 sm:order-1">
              <Button
                type="button"
                onClick={handleShowAdditionalSection}
                variant="outline"
                className="w-full text-purple-600 bg-transparent border-purple-300 hover:bg-purple-50 sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Additional Tasks
              </Button>
            </div>
            <div className="flex flex-col order-1 space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:order-2">
              <Button
                type="button"
                variant="outline"
                className="w-full px-6 py-3 bg-transparent sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center w-full px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  `Add Task${additionalTasks.length > 0
                    ? `s (${additionalTasks.length + 1})`
                    : ""
                  }`
                )}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
