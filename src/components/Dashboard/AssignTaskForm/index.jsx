"use client";
import { useState, useEffect } from "react";
import supabase from "../../../supabaseClient";
import { useDropdownData } from "./useDropdownData";
// Optional: import { uploadFileToGoogleDrive } from "./uploadFile"; // Replaced with Supabase upload below
import AdminForm from "./AdminForm";
import CompanyForm from "./CompanyForm";

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

  const [currentCompanyName, setCurrentCompanyName] = useState("");
  const [additionalTasks, setAdditionalTasks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const {
    postedByOptions,
    partyNames,
    workTypes,
    isLoadingDropdowns,
    systemNames,
    setSystemNames,
    isLoadingSystemNames,
    fetchSystemNames
  } = useDropdownData(userRole, currentCompanyName);

  useEffect(() => {
    if (userRole === "company") {
      try {
        const session = sessionStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          const companyName =
            userData.companyData?.companyName ||
            userData.companyData?.companyId ||
            userData.username ||
            "";
          setCurrentCompanyName(companyName);
        }
      } catch (error) {
        console.error("Error getting company name from session:", error);
        setCurrentCompanyName("");
      }
    }
  }, [userRole]);

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

        fetchSystemNames(value, formData.partyName);
      }
    } else if (name === "partyName") {
      setFormData((prev) => ({
        ...prev,
        partyName: value,
        systemName: "",
      }));
      setSystemNames([]);
      
      if (formData.typeOfWork && formData.typeOfWork !== "Complain Report") {
        fetchSystemNames(formData.typeOfWork, value);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        e.target.value = "";
        return;
      }

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

          if (field === "typeOfWork") {
            if (
              (userRole === "admin" ||
                userRole === "user" ||
                userRole === "company") &&
              value === "Complain Report"
            ) {
              updatedTask.isTypeOfWorkInput = true;
            } else {
              updatedTask.isTypeOfWorkInput = false;

              if (userRole === "admin" || userRole === "user") {
                fetchSystemNames(value, formData.partyName);
              } else {
                fetchSystemNames(value, currentCompanyName);
              }
              updatedTask.systemName = "";
            }
          }

          if (field === "customTypeOfWork") {
            updatedTask.typeOfWork = value;
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
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.postedBy) newErrors.postedBy = "Posted By is required";
      if (!formData.partyName) newErrors.partyName = "Party Name is required";
      if (!formData.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
      if (!formData.description) newErrors.description = "Description is required";
      if (!formData.expectedDate) newErrors.expectedDate = "Expected Date is required";
    } else {
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.personName) newErrors.personName = "Person Name is required";
      if (!formData.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
      if (!formData.systemName) newErrors.systemName = "System Name is required";
      if (!formData.description) newErrors.description = "Description is required";
      if (!formData.expectedDate) newErrors.expectedDate = "Expected Date is required";
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
      let fileUrl = "";
      if (formData.attachment) {
        setUploadProgress("Uploading file...");

        const fileName = `TK-TEMP-${Date.now()}-${formData.attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachment_file")
          .upload(fileName, formData.attachment);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachment_file")
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
      }

      const allTasks = [formData, ...additionalTasks].map((task) => ({
        date: formData.date,
        postedBy: formData.postedBy,
        takenFrom: formData.takenFrom,
        partyName: formData.partyName,
        personName: formData.personName,

        typeOfWork: task.typeOfWork || formData.typeOfWork,
        systemName: task.systemName || "",
        description: task.description || "",
        link: task.link || "",
        priority: task.priority || formData.priority,
        notes: task.notes || "",
        expectedDate: task.expectedDate || formData.expectedDate,

        attachment_file: fileUrl,
      }));

      const submittedTasks = [];

      for (const [index, task] of allTasks.entries()) {
        setUploadProgress(`Submitting task ${index + 1}...`);

        let targetTable = "FMS";
        if (userRole === "company" && task.typeOfWork === "New system") {
          targetTable = "new_system";
        }

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
          };
        }

        const { error: insertError, data: insertedData } = await supabase
          .from(targetTable)
          .insert([insertPayload])
          .select();

        if (insertError) throw insertError;

        submittedTasks.push(insertedData[0]);
      }

      if (onTaskCreated) onTaskCreated(submittedTasks);

      alert(`${submittedTasks.length} task(s) created successfully.`);

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

  const handleShowAdditionalSection = () => {
    addAdditionalTask();
  };

  const commonProps = {
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
  };

  if (userRole === "company") {
    return <CompanyForm {...commonProps} currentCompanyName={currentCompanyName} />;
  } else {
    return <AdminForm {...commonProps} />;
  }
}
