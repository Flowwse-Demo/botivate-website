"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  User,
  Building,
  FileText,
  Link,
  Paperclip,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import supabase from "../../supabaseClient";

// File upload utility function - Updated to work with your existing Google Apps Script
const uploadFileToGoogleDrive = async (file, taskNumber) => {
  if (!file) return "";

  try {
    // Convert file to base64
    const fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "uploadFile",
          fileName: `${taskNumber}_${file.name}`,
          fileData: fileBase64,
          mimeType: file.type,
          taskNumber: taskNumber,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      return result.fileUrl; // Return the Google Drive file URL
    } else {
      console.error("File upload failed:", result.error);
      return `Error uploading: ${file.name}`;
    }
  } catch (error) {
    console.error("File upload error:", error);
    return `Error uploading: ${file.name}`;
  }
};

export default function AssignTaskForm({ onTaskCreated, userRole = "admin" }) {
  const [formData, setFormData] = useState({
    date: "",
    postedBy: "",
    takenFrom: "",
    partyName: "",
    typeOfWork: "",
    systemName: "",
    description: "",
    link: "",
    attachment: null,
    priority: "",
    notes: "",
    expectedDate: "",
    personName: "",
    isSystemNameInput: false,
    isTypeOfWorkInput: false,
    isTakenFromInput: false,
  });
  // State for current company name (dynamic)
  const [currentCompanyName, setCurrentCompanyName] = useState("");

  const [additionalTasks, setAdditionalTasks] = useState([]);
  const [showAdditionalSection, setShowAdditionalSection] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // State for dropdown options from sheet
  const [postedByOptions, setPostedByOptions] = useState([]);
  const [partyNames, setPartyNames] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  // State for system names based on type of work selection
  const [systemNames, setSystemNames] = useState([]);
  const [isLoadingSystemNames, setIsLoadingSystemNames] = useState(false);

  // Get current company name dynamically from session storage
  useEffect(() => {
    if (userRole === "company") {
      try {
        const session = sessionStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          // console.log('Session data:', userData); // Debug log

          // Try multiple sources for company name
          const companyName =
            userData.companyData?.companyName ||
            userData.companyData?.companyId ||
            userData.username ||
            "";

          // console.log('Retrieved company name:', companyName); // Debug log
          setCurrentCompanyName(companyName);
        }
      } catch (error) {
        console.error("Error getting company name from session:", error);
        setCurrentCompanyName("");
      }
    }
  }, [userRole]);

  const fetchDropdownData = async () => {
    try {
      // Fetch only the columns you need
      const { data, error } = await supabase
        .from("dropdown")
        .select("party_name, type_of_work, posted_by");

      if (error) throw error;

      if (data && Array.isArray(data)) {
        // Use Sets to collect unique non-empty values
        const partyNameSet = new Set();
        const workTypeSet = new Set();
        const postedBySet = new Set();

        data.forEach((row) => {
          if (row.party_name && String(row.party_name).trim() !== "") {
            partyNameSet.add(String(row.party_name).trim());
          }
          if (row.type_of_work && String(row.type_of_work).trim() !== "") {
            workTypeSet.add(String(row.type_of_work).trim());
          }
          if (row.posted_by && String(row.posted_by).trim() !== "") {
            postedBySet.add(String(row.posted_by).trim());
          }
        });
        // console.log("hi",Array.from(postedBySet).sort());

        // Convert Sets to sorted arrays
        setPartyNames(Array.from(partyNameSet).sort());
        setWorkTypes(Array.from(workTypeSet).sort());
        setPostedByOptions(Array.from(postedBySet).sort());
      }
    } catch (error) {
      console.error("❌ Error fetching dropdown data:", error.message);

      // ✅ Fallback values
      setPartyNames(["Acemark Stationers", "AT Jewellers", "Azure Interiors"]);
      setWorkTypes([
        "Existing System Edit & Update",
        "New System",
        "Error Received",
        "Complain Report",
      ]);
      setPostedByOptions([
        "Satyendra",
        "Chetan",
        "Digendra",
        "Pratap",
        "Vikas",
        "Tuleshwar",
      ]);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // ✅ FIXED: Load data on component mount first, then when currentCompanyName changes
  useEffect(() => {
    fetchDropdownData();
  }, []); // Initial load

  // ✅ FIXED: Re-fetch only when company name changes and it's not empty
  useEffect(() => {
    if (
      userRole === "company" &&
      currentCompanyName &&
      currentCompanyName !== ""
    ) {
      fetchDropdownData();
    }
  }, [currentCompanyName]); // Re-fetch when company name changes

  // Fetch system names based on type of work selection
 // Fetch system names based on type of work selection AND party name for admin
const fetchSystemNames = async (typeOfWork) => {
  if (!typeOfWork) {
    setSystemNames([]);
    return;
  }

  setIsLoadingSystemNames(true);

  try {
    // ✅ Fetch systems from Supabase
    const { data, error } = await supabase
      .from("system_list")
      .select("party_name, system_name, type_of_system, status_of_system");

    if (error) throw error;

    const systemNamesSet = new Set();

    data.forEach((row) => {
      const rowTypeOfWork = row.type_of_system
        ? String(row.type_of_system).trim()
        : "";
      const columnEStatus = row.status_of_system
        ? String(row.status_of_system).trim()
        : "";
      const rowPartyName = row.party_name
        ? String(row.party_name).trim()
        : "";

      if (rowTypeOfWork === typeOfWork) {
        let shouldInclude = true;

        // सिर्फ "New System" के लिए filter
        if (typeOfWork === "New System") {
          shouldInclude = !columnEStatus || columnEStatus === "";
        }

        if (shouldInclude) {
          if (userRole === "admin" || userRole === "user") {
            // ✅ ADMIN: Party Name ke according filter karo
            if (formData.partyName && rowPartyName === formData.partyName) {
              const systemName = row.system_name
                ? String(row.system_name).trim()
                : "";
              if (systemName !== "") {
                systemNamesSet.add(systemName);
              }
            }
          } else {
            // Company: match with current company name (pehle se tha)
            if (currentCompanyName && rowPartyName === currentCompanyName) {
              const systemName = row.system_name
                ? String(row.system_name).trim()
                : "";
              if (systemName !== "") {
                systemNamesSet.add(systemName);
              }
            }
          }
        }
      }
    });

    setSystemNames(Array.from(systemNamesSet).sort());
  } catch (error) {
    console.error(
      "❌ Error fetching system names from Supabase:",
      error.message
    );
    setSystemNames([]);
  } finally {
    setIsLoadingSystemNames(false);
  }
};
 const handleInputChange = (e) => {
  const { name, value } = e.target;

  if (name === "typeOfWork") {
    if (value === "Complain Report") {
      setFormData((prev) => ({
        ...prev,
        typeOfWork: value,
        isTypeOfWorkInput: prev.isTypeOfWorkInput,
        isSystemNameInput: true,
        systemName: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        typeOfWork: value,
        isTypeOfWorkInput: prev.isTypeOfWorkInput,
        isSystemNameInput: false,
        systemName: "",
      }));

      fetchSystemNames(value);
    }
  } else if (name === "partyName") {
    // ✅ Party Name change hone par System Name reset karo
    setFormData((prev) => ({
      ...prev,
      partyName: value,
      systemName: "",
    }));
    setSystemNames([]); // System names list ko bhi clear karo
    
    // Agar Type of Work already selected hai, to refresh karo
    if (formData.typeOfWork && formData.typeOfWork !== "Complain Report") {
      fetchSystemNames(formData.typeOfWork);
    }
  } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};

  // Rest of your code remains the same...
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        e.target.value = "";
        return;
      }

      // Check file type (you can customize allowed types)
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(
          "File type not supported. Please upload images, PDF, Word, Excel, or text files."
        );
        e.target.value = "";
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      attachment: file,
    }));
  };

  const addAdditionalTask = () => {
    setAdditionalTasks([
      ...additionalTasks,
      {
        id: Date.now(),
        typeOfWork: "",
        systemName: "",
        description: "",
        link: "",
        priority: "",
        notes: "",
        expectedDate: "",
      },
    ]);
  };

  const removeAdditionalTask = (id) => {
    setAdditionalTasks(additionalTasks.filter((task) => task.id !== id));
  };

  const updateAdditionalTask = (id, field, value) => {
    setAdditionalTasks(
      additionalTasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, [field]: value };

          // Handle Type of Work change for additional tasks
          if (field === "typeOfWork") {
            // Check if admin/user/company selected "Complain Report" - then make it input field
            if (
              (userRole === "admin" ||
                userRole === "user" ||
                userRole === "company") &&
              value === "Complain Report"
            ) {
              // For Complain Report, don't fetch systems, allow free text input
              // The value will be stored as custom text in typeOfWork field
              updatedTask.isTypeOfWorkInput = true; // Flag to show input instead of dropdown
            } else {
              // Normal dropdown behavior for other selections
              updatedTask.isTypeOfWorkInput = false;

              if (userRole === "admin" || userRole === "user") {
                fetchSystemNames(value);
              } else {
                // For company, use current company name to filter systems
                fetchSystemNames(value);
              }
              updatedTask.systemName = ""; // Reset system name
            }
          }

          // Handle custom Type of Work input (when typing in input field)
          if (field === "customTypeOfWork") {
            updatedTask.typeOfWork = value; // Store custom value in typeOfWork field
            updatedTask.isTypeOfWorkInput = true;
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (userRole === "admin" || userRole === "user") {
      // Admin validation (original)
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.postedBy) newErrors.postedBy = "Posted By is required";
      if (!formData.partyName) newErrors.partyName = "Party Name is required";
      if (!formData.typeOfWork)
        newErrors.typeOfWork = "Type of Work is required";
      // if (!formData.systemName) newErrors.systemName = "System Name is required"
      if (!formData.description)
        newErrors.description = "Description is required";
      if (!formData.expectedDate)
        newErrors.expectedDate = "Expected Date is required";
    } else {
      // Company validation (simplified)
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.personName)
        newErrors.personName = "Person Name is required";
      if (!formData.typeOfWork)
        newErrors.typeOfWork = "Type of Work is required";
      if (!formData.systemName)
        newErrors.systemName = "System Name is required";
      if (!formData.description)
        newErrors.description = "Description is required";
      if (!formData.expectedDate)
        newErrors.expectedDate = "Expected Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress("Preparing submission...");

    try {
      // ✅ Upload file to Supabase storage if exists
      let fileUrl = "";
      if (formData.attachment) {
        setUploadProgress("Uploading file...");

        const fileName = `TK-TEMP-${Date.now()}-${formData.attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachment_file") // bucket name
          .upload(fileName, formData.attachment);

        if (uploadError) throw uploadError;

        // ✅ Get public URL of uploaded file
        const { data: urlData } = supabase.storage
          .from("attachment_file")
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
      }

      // ✅ Prepare tasks data (including additionalTasks)
      const allTasks = [formData, ...additionalTasks].map((task) => ({
        // Common fields
        date: formData.date,
        postedBy: formData.postedBy,
        takenFrom: formData.takenFrom,
        partyName: formData.partyName,
        personName: formData.personName,

        // Task-specific fields
        typeOfWork: task.typeOfWork || formData.typeOfWork,
        systemName: task.systemName || "",
        description: task.description || "",
        link: task.link || "",
        priority: task.priority || formData.priority,
        notes: task.notes || "",
        expectedDate: task.expectedDate || formData.expectedDate,

        // File for all tasks
        attachment_file: fileUrl,
      }));

      const submittedTasks = [];

      // ✅ Insert each task
      for (const [index, task] of allTasks.entries()) {
        setUploadProgress(`Submitting task ${index + 1}...`);

        // Decide target table
        let targetTable = "FMS"; // default
        if (userRole === "company" && task.typeOfWork === "New system") {
          targetTable = "new_system";
        }

        // Map insert payload by table
        let insertPayload = {};
        if (targetTable === "FMS") {
          insertPayload = {
            given_date: task.date,
            posted_by:
              userRole === "admin" || userRole === "user"
                ? task.postedBy
                : formData.personName,
            type_of_work: task.typeOfWork,
            taken_from: task.takenFrom || "",
            party_name:
              userRole === "admin" || userRole === "user"
                ? task.partyName
                : currentCompanyName,
            system_name: task.systemName,
            description_of_work: task.description,
            link_of_system: task.link,
            attachment_file: task.attachment_file,
            priority_in_customer: task.priority,
            notes: task.notes,
            expected_date_to_close: task.expectedDate,
          };
        } else if (targetTable === "new_system") {
          insertPayload = {
            given_date: task.date,
            posted_by: formData.personName,
            type_of_work: task.typeOfWork,
            taken_from: task.takenFrom,
            party_name: currentCompanyName,
            system_name: task.systemName,
            description_of_work: task.description,
            link_of_system: task.link,
            attachment_file: task.attachment_file,
            priority_in_customer: task.priority,
            notes: task.notes,
            expected_date_to_close: task.expectedDate,
            // task_no will be auto-generated by DB trigger
          };
        }

        // Insert into chosen table
        const { error: insertError, data: insertedData } = await supabase
          .from(targetTable)
          .insert([insertPayload])
          .select();

        if (insertError) throw insertError;

        submittedTasks.push(insertedData[0]);
      }

      // ✅ Callback for parent
      if (onTaskCreated) onTaskCreated(submittedTasks);

      alert(`${submittedTasks.length} task(s) created successfully.`);

      // ✅ Reset form
      setFormData({
        date: "",
        postedBy: "",
        typeOfWork: "",
        takenFrom: "",
        partyName: "",
        systemName: "",
        description: "",
        link: "",
        attachment: null,
        priority: "",
        notes: "",
        expectedDate: "",
        personName: "",
      });
      setAdditionalTasks([]);
      setShowAdditionalSection(false);
      setSystemNames([]);
    } catch (error) {
      console.error("❌ Submission error:", error.message);
      const msg = error.message.includes("busy")
        ? "System busy. Try again."
        : "Submission failed. Try again.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  // const handleShowAdditionalSection = () => {
  //   if (!showAdditionalSection) {
  //     setShowAdditionalSection(true);
  //     addAdditionalTask();
  //   } else {
  //     setShowAdditionalSection(false);
  //     setAdditionalTasks([]);
  //   }
  // };


  const handleShowAdditionalSection = () => {
    addAdditionalTask();
  };

  // Company form task renderer
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

  // Company Login Form (Simplified)
  const renderCompanyForm = () => (
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

  // Admin form task renderer
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
                    : updateAdditionalTask(
                      task.id,
                      "typeOfWork",
                      e.target.value
                    )
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
                    : updateAdditionalTask(
                      task.id,
                      "typeOfWork",
                      e.target.value
                    )
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
                    : updateAdditionalTask(
                      task.id,
                      "expectedDate",
                      e.target.value
                    )
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

  const renderAdminForm = () => (
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
                  // value={formData.takenFrom ? formData.takenFrom[0]?.toUpperCase() + formData.takenFrom.slice(1)?.toLowerCase() : ""}
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
                  } // agar empty chhoda to wapas dropdown
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
                  {/* <Button
                    type="button"
                    onClick={addAdditionalTask}
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 bg-transparent border-blue-300 hover:bg-blue-50 sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Task
                  </Button> */}
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

  // Main render logic based on userRole
  if (userRole === "company") {
    return renderCompanyForm();
  } else {
    return renderAdminForm();
  }
}
