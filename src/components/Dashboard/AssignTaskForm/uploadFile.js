import { SHEET_URL } from "../../../config/api";

// File upload utility function - Updated to work with existing Google Apps Script
export const uploadFileToGoogleDrive = async (file, taskNumber) => {
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
      SHEET_URL,
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
