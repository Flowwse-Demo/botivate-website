import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Button from "../../ui/Button";

export default function CompanyForm({
  formData,
  setFormData,
  handleInputChange,
  errors,
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
  handleShowAdditionalSection,
  currentCompanyName
}) {

  const renderCompanyTaskForm = (task, index, isMain = false) => (
    <div
      key={isMain ? "main-company" : `company-task-${task.id}`}
      className="p-4 mb-4 rounded-lg bg-gray-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Task {index + 1}
        </h3>
        {!isMain && (
          <button
            type="button"
            onClick={() => removeAdditionalTask(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Type of Work */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Type of Work
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.systemName ? "border-red-300" : "border-gray-300"
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

        {/* Description Of Work */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Description Of Work
          </label>
          <textarea
            name={isMain ? "description" : ""}
            value={isMain ? formData.description : task.description}
            onChange={(e) =>
              isMain
                ? handleInputChange(e)
                : updateAdditionalTask(task.id, "description", e.target.value)
            }
            rows={4}
            placeholder="Enter Description"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.description
                ? "border-red-300"
                : "border-gray-300"
              }`}
          />
          {isMain && errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Link of System */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Link of System
          </label>
          <input
            type="url"
            name={isMain ? "link" : ""}
            value={isMain ? formData.link : task.link}
            onChange={(e) =>
              isMain
                ? handleInputChange(e)
                : updateAdditionalTask(task.id, "link", e.target.value)
            }
            placeholder="Enter System Link"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
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
            placeholder="Enter Notes"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Expected Date To Close */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Expected Date To Close
          </label>
          <input
            type="date"
            name={isMain ? "expectedDate" : ""}
            value={isMain ? formData.expectedDate : task.expectedDate}
            onChange={(e) =>
              isMain
                ? handleInputChange(e)
                : updateAdditionalTask(task.id, "expectedDate", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMain && errors.expectedDate
                ? "border-red-300"
                : "border-gray-300"
              }`}
          />
          {isMain && errors.expectedDate && (
            <p className="mt-1 text-sm text-red-600">{errors.expectedDate}</p>
          )}
        </div>

        {/* Priority for Customer */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Priority for Customer
          </label>
          <select
            name={isMain ? "priority" : ""}
            value={isMain ? formData.priority : task.priority}
            onChange={(e) =>
              isMain
                ? handleInputChange(e)
                : updateAdditionalTask(task.id, "priority", e.target.value)
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Upload File (Optional) - Only for main task */}
        {isMain && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload File (Optional)
              <span className="ml-2 text-xs text-gray-500">
                (Max 10MB - Images, PDF, Word, Excel, Text files)
              </span>
            </label>
            <input
              type="file"
              name="attachment"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.attachment && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Selected: {formData.attachment.name} (
                {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 shadow-lg rounded-xl"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Generate New Ticket
          </h2>
          {currentCompanyName && (
            <p className="mt-1 text-sm text-center text-gray-600">
              Company: {currentCompanyName}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? "border-red-300" : "border-gray-300"
                }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Person Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Person Name
            </label>
            <input
              type="text"
              name="personName"
              value={formData.personName}
              onChange={handleInputChange}
              placeholder="Enter Person Name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.personName ? "border-red-300" : "border-gray-300"
                }`}
            />
            {errors.personName && (
              <p className="mt-1 text-sm text-red-600">{errors.personName}</p>
            )}
          </div>

          {/* Main Task Section */}
          {renderCompanyTaskForm(formData, 0, true)}

          {/* Additional Tasks Section */}
          <AnimatePresence>
            {additionalTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderCompanyTaskForm(task, index + 1, false)}
              </motion.div>
            ))}
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
                <span className="text-blue-700">{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={addAdditionalTask}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD TASK
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                  SUBMITTING...
                </>
              ) : (
                `SUBMIT TICKET${additionalTasks.length > 0
                  ? ` (${additionalTasks.length + 1} Tasks)`
                  : ""
                }`
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
