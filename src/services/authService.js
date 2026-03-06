
// Auth Service — data-fetching functions extracted from LoginModal

// Function to validate admin credentials
export const validateAdminCredentials = (username, password) => {
  const adminCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'superadmin', password: 'super123' },
  ];

  return adminCredentials.some(
    admin => admin.username === username && admin.password === password
  );
};

// Fetch Master Sheet Link data (for company login)
export const fetchMasterSheetLinkData = async () => {
  try {
    const payload = new URLSearchParams()
    payload.append("action", "getMasterSheetData")
    payload.append("sheet", "Master Sheet Link")

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      }
    )

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("Error fetching Master Sheet Link data:", error)

    // Fallback: try GET method with sheet parameter
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec?sheet=Master Sheet Link&timestamp=${timestamp}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.success ? data.data : null
    } catch (fallbackError) {
      console.error("Fallback method also failed:", fallbackError)
      return null
    }
  }
}

// Fetch Master Sheet data
export const fetchMasterSheetData = async () => {
  try {
    const payload = new URLSearchParams()
    payload.append("action", "getDashboardData")

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      }
    )

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("Error fetching master sheet data:", error)
    return null
  }
}

// Fetch FMS sheet data - using the existing working endpoint
export const fetchFMSData = async () => {
  try {
    const timestamp = new Date().getTime()
    const response = await fetch(`https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec?sheet=FMS&timestamp=${timestamp}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("Error fetching FMS data:", error)
    return null
  }
}

// Function to get Master Sheet and FMS data for user filtering
export const getUserFilterData = async (username, role) => {

  if (role === 'admin') {
    // Admin sees all data, no filtering needed
    return {
      isAdmin: true,
      userExists: true,
      showAllData: true,
      userRowData: null,
      userRowIndex: -1
    }
  }

  try {
    // Get both Master Sheet and FMS data

    // Try to fetch FMS data first (we know this endpoint works)
    const fmsData = await fetchFMSData();

    // For now, let's use FMS data for both validations since Master Sheet endpoint might not exist
    // You can add the Master Sheet endpoint to your Google Apps Script later
    let masterSheetData = null;

    try {
      masterSheetData = await fetchMasterSheetData();
    } catch (masterError) {
      // Fallback: use FMS data for validation
      masterSheetData = fmsData;
    }

    if (!masterSheetData || !fmsData) {
      return {
        isAdmin: false,
        userExists: false,
        showAllData: false,
        userRowData: null,
        userRowIndex: -1,
        message: 'Failed to fetch sheet data'
      }
    }


    // Find user in Master Sheet Link (Column J - index 9) OR FMS Column X (index 23)
    let userMasterIndex = -1;

    // First try to find in Master Sheet Column J
    if (masterSheetData && masterSheetData !== fmsData) {
      userMasterIndex = masterSheetData.findIndex((row, index) => {
        const cellValue = row[9] ? row[9].toString().trim().toLowerCase() : '';
        const match = cellValue === username.trim().toLowerCase();
        if (match) {
        }
        return match;
      });
    }

    // If not found in Master Sheet or Master Sheet not available, try FMS Column X
    if (userMasterIndex === -1) {
      userMasterIndex = fmsData.findIndex((row, index) => {
        const cellValue = row[23] ? row[23].toString().trim().toLowerCase() : '';
        const match = cellValue === username.trim().toLowerCase();
        if (match) {
        }
        return match;
      });
    }

    if (userMasterIndex === -1) {
      // Debug: show some sample values
      //   fmsData.slice(0, 10).map((row, idx) => `Row ${idx + 1}: "${row[23] || 'empty'}"`));
      return {
        isAdmin: false,
        userExists: false,
        showAllData: false,
        userRowData: null,
        userRowIndex: -1,
        message: `User "${username}" not found in system`
      }
    }

    // Check if user exists in FMS sheet at the found row
    const fmsRow = fmsData[userMasterIndex];

    if (!fmsRow) {
      return {
        isAdmin: false,
        userExists: false,
        showAllData: false,
        userRowData: null,
        userRowIndex: -1,
        message: `No corresponding row found in FMS sheet at index ${userMasterIndex + 1}`
      }
    }

    // Verify user in Column X (index 23)
    const columnXValue = fmsRow[23] ? fmsRow[23].toString().trim().toLowerCase() : '';

    if (columnXValue !== username.trim().toLowerCase()) {

      // If user was found by Column X search, this shouldn't happen, but let's continue anyway
      if (columnXValue === '') {
      } else {
        return {
          isAdmin: false,
          userExists: false,
          showAllData: false,
          userRowData: null,
          userRowIndex: -1,
          message: `Username mismatch: Expected "${username}" but FMS Column X has "${columnXValue}"`
        }
      }
    }

    // Check Column AE (index 30) for status
    const statusAE = fmsRow[30] ? fmsRow[30].toString().trim() : '';

    let shouldShowUserData = false;
    let userRowIndex = userMasterIndex;
    let assignedColumn = 'X';

    if (statusAE === 'forward2') {
      // If status is forward2, check Column Y (index 24) for username match
      const columnY = fmsRow[24] ? fmsRow[24].toString().trim().toLowerCase() : '';

      if (columnY === username.trim().toLowerCase()) {
        shouldShowUserData = true;
        assignedColumn = 'Y';
      } else {
        return {
          isAdmin: false,
          userExists: false,
          showAllData: false,
          userRowData: null,
          userRowIndex: -1,
          message: `Task is forwarded to "${columnY}" but you are "${username}"`
        }
      }
    } else {
      // For any status other than forward2, use Column X (already validated above)
      shouldShowUserData = true;
      assignedColumn = 'X';
    }

    if (shouldShowUserData) {
      return {
        isAdmin: false,
        userExists: true,
        showAllData: false,
        userRowData: fmsRow,
        userRowIndex: userRowIndex,
        assignedColumn: assignedColumn,
        statusAE: statusAE
      }
    }

    return {
      isAdmin: false,
      userExists: false,
      showAllData: false,
      userRowData: null,
      userRowIndex: -1,
      message: 'User validation failed'
    }

  } catch (error) {
    console.error("❌ Error fetching user filter data:", error);
    return {
      isAdmin: false,
      userExists: false,
      showAllData: false,
      userRowData: null,
      userRowIndex: -1,
      error: error.message,
      message: `Error during validation: ${error.message}`
    }
  }
}

// Function to validate company login
export const getCompanyData = async (companyId, password) => {

  try {
    // Fetch Master Sheet Link data
    const masterSheetData = await fetchMasterSheetLinkData();

    if (!masterSheetData) {
      return {
        isCompany: false,
        companyExists: false,
        companyRowData: null,
        companyRowIndex: -1,
        message: 'Failed to fetch company data'
      }
    }


    // Find company in Master Sheet Link
    // Column A (index 0) = ID
    // Column B (index 1) = Password  

    const companyIndex = masterSheetData.findIndex((row, index) => {
      const idValue = row[0] ? row[0].toString().trim().toLowerCase() : '';
      const passwordValue = row[1] ? row[1].toString().trim() : '';

      const idMatch = idValue === companyId.trim().toLowerCase();
      const passwordMatch = passwordValue === password.trim();

      const allMatch = idMatch && passwordMatch;

      if (allMatch) {
      }

      return allMatch;
    });

    if (companyIndex === -1) {
      // Debug: show some sample values
      //   masterSheetData.slice(0, 5).map((row, idx) => ({
      //     row: idx + 1,
      //     id: row[0] || 'empty',
      //   })));
      return {
        isCompany: false,
        companyExists: false,
        companyRowData: null,
        companyRowIndex: -1,
        message: `Company with ID "${companyId}" not found or invalid credentials`
      }
    }

    const companyRow = masterSheetData[companyIndex];
    const paginationNew = companyRow[4] ? companyRow[4].toString().trim() : '';
    const companyName = companyRow[2] ? companyRow[2].toString().trim() : '';


    return {
      isCompany: true,
      companyExists: true,
      companyRowData: companyRow,
      companyRowIndex: companyIndex,
      paginationNew: paginationNew,
      companyId: companyId,
      companyName: companyName
    }

  } catch (error) {
    console.error("❌ Error fetching company data:", error);
    return {
      isCompany: false,
      companyExists: false,
      companyRowData: null,
      companyRowIndex: -1,
      error: error.message,
      message: `Error during company validation: ${error.message}`
    }
  }
}
