import supabase from "../../../supabaseClient";

// Fetch data from Supabase
export const fetchSupabaseData = async () => {
  try {
    // Query all rows from FMS table
    const { data, error } = await supabase.from("FMS").select("*");

    if (error) throw error;

    // Ensure array response
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching Supabase FMS data:", error);
    return [];
  }
};

// Enhanced user role determination (unchanged)
export const determineUserRole = (username, userFilterData, companyData) => {
  // Method 1: Check if username is admin (highest priority)
  if (username === "admin") {
    return "admin";
  }

  // Method 2: Check userFilterData.isAdmin
  if (userFilterData?.isAdmin === true) {
    return "admin";
  }

  // Method 3: Check for company data (company login)
  if (companyData && companyData.companyName && !userFilterData?.username) {
    return "company";
  }

  // Method 4: Check if user has individual user data (individual user login)
  if (
    userFilterData &&
    (userFilterData.username ||
      userFilterData.name ||
      userFilterData.memberName)
  ) {
    return "user";
  }

  // Method 5: Check session storage for role
  if (typeof window !== "undefined") {
    try {
      const session = sessionStorage.getItem("userSession");
      if (session) {
        const userData = JSON.parse(session);
        if (userData.role === "admin") {
          return "admin";
        }
        if (userData.role === "company") {
          return "company";
        }
        if (userData.role === "user") {
          return "user";
        }
      }
    } catch (error) {
    }
  }

  // Default to user if we have user data, otherwise admin
  const defaultRole = userFilterData ? "user" : "admin";
  return defaultRole;
};

// Calculate stats from Supabase data
export const calculateStatsFromSupabase = (
  supabaseData,
  userRole = "admin",
  companyData = null,
  userFilterData = null
) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return {
      totalTasks: 0,
      activeTasks: 0,
      completedToday: 0,
      pendingIssues: 0,
    };
  }

  let filteredData = [...supabaseData];

  // Filter data based on user role
  if (userRole === "company" && companyData && companyData.companyName) {
    filteredData = filteredData.filter(
      (item) =>
        item.party_name &&
        item.party_name?.toLowerCase() === companyData?.companyName?.toLowerCase()
    );
  } else if (userRole === "user" && userFilterData) {
    let userName = null;
    if (userFilterData.username) {
      userName = userFilterData.username;
    } else if (userFilterData.name) {
      userName = userFilterData.name;
    } else if (userFilterData.memberName) {
      userName = userFilterData.memberName;
    }

    if (userName && userName !== "undefined" && userName !== "Unknown User") {
      filteredData = filteredData.filter((item) => {
        const employeeName1 = item.team_member_name
          ? item.team_member_name.toString().trim().toLowerCase()
          : "";
        const employeeName2 = item.employee_name_2
          ? item.employee_name_2.toString().trim().toLowerCase()
          : "";
        const userNameLower = userName.toLowerCase();

        return (
          employeeName1 === userNameLower || employeeName2 === userNameLower
        );
      });
    } else {
      filteredData = [];
    }
  }

  const stats = {
    totalTasks: filteredData.length,
    activeTasks:
      userRole === "admin"
        ? filteredData.filter(
          (item) => !item.actual3 || item.actual3.toString().trim() === ""
        ).length
        : 0,
    completedToday: filteredData.filter(
      (item) => item.actual3 && item.actual3.toString().trim() !== ""
    ).length,
    pendingIssues: filteredData.filter(
      (item) => !item.actual3 || item.actual3.toString().trim() === ""
    ).length,
  };

  return stats;
};

// Get company table data from Supabase
export const getCompanyTableDataFromSupabase = (supabaseData, companyData) => {
  if (
    !supabaseData ||
    !Array.isArray(supabaseData) ||
    !companyData ||
    !companyData.companyName
  ) {
    return [];
  }

  // Filter data for the company
  const filteredData = supabaseData.filter(
    (item) =>
      item.party_name &&
      item.party_name?.toLowerCase() === companyData?.companyName?.toLowerCase()
  );

  // Process and format the data
  const tableData = filteredData
    .map((item, index) => {
      let status = "Not Started";
      if (item.actual3 && item.actual3.toString().trim() !== "") {
        status = "Completed";
      } else if (item.planned3 && item.planned3.toString().trim() !== "") {
        status = "In Progress";
      }

      return {
        id: item.id || index + 1,
        taskNo: item.task_no || `Task-${index + 1}`,
        status: status,
        partyName: item.party_name || "N/A",
        typeOfWork: item.type_of_work || "N/A",
        systemName: item.system_name || "N/A",
        descriptionOfWork: item.description_of_work || "N/A",
        notes: item.notes || "N/A",
        takenFrom: item.taken_from || "N/A",
        expectedDateToClose: item.expected_date_to_close || "N/A",
        priority: item.priority_in_customer || "Normal",
        linkOfSystem: item.website_link || "N/A",
        attachmentFile: item.attachment_file || "N/A",
        actualSubmitDate: item.actual3 || "N/A",
      };
    })
    .filter((item) => item.taskNo !== "");

  return tableData;
};


// ============================================================================
// TIME CALCULATION FUNCTIONS
// ============================================================================

export const calculateTimeDifference = (item) => {
  try {
    const planned3 = item.planned3;
    const actual3 = item.actual3;
    const planned2 = item.planned2;
    const actual2 = item.actual2;
    const howManyTimeTake = item.how_many_time_take;
    const howManyTimeTake2 = item.how_many_time_take_2;
    const actual1 = item.actual1;

    
    
    
    
    
    
    
    
    

    // Helper to check if value is NOT NULL
    const isNotNull = (value) => {
      return value !== null &&
        value !== undefined &&
        value.toString().trim() !== "";
    };

    // Helper to check if value IS NULL
    const isNull = (value) => {
      return value === null ||
        value === undefined ||
        value.toString().trim() === "";
    };

    // Helper to check if string is a valid date (not a name)
    const isValidDateString = (str) => {
      if (!str || typeof str !== 'string') return false;

      // If it contains only letters and spaces, it's likely a name
      if (/^[a-zA-Z\s]+$/.test(str.trim())) {
        
        return false;
      }

      // Check if it's a valid date
      const date = new Date(str);
      const isValid = !isNaN(date.getTime());
      
      return isValid;
    };

    // 1️⃣ PRIMARY CONDITION: If BOTH planned3 AND actual3 are NOT NULL
    if (isNotNull(planned3) && isNotNull(actual3)) {
      
      return "0h 0m";
    }

    // 2️⃣ SECONDARY CONDITION: If planned3 is NOT NULL AND actual3 is NULL
    if (isNotNull(planned3) && isNull(actual3)) {
      

      // 🧠 SUB-CONDITION A: Both planned2 AND actual2 are NULL
      if (isNull(planned2) && isNull(actual2)) {
        

        // Check if both values exist and are valid dates
        if (isNotNull(howManyTimeTake) && isNotNull(actual1)) {
          const howManyTimeTakeStr = howManyTimeTake.toString().trim();
          const actual1Str = actual1.toString().trim();

          // Validate both are dates, not names
          if (isValidDateString(howManyTimeTakeStr) && isValidDateString(actual1Str)) {
            
            
            

            const result = calculateWorkingHoursDifference(actual1Str, howManyTimeTakeStr);
            
            return result;
          } else {
            
            return "0h 0m";
          }
        } else {
          
          return "0h 0m";
        }
      }

      // 🧠 SUB-CONDITION B: Both planned2 AND actual2 are NOT NULL
      if (isNotNull(planned2) && isNotNull(actual2)) {
        

        if (isNotNull(howManyTimeTake2)) {
          
          const result = formatTimeWithWorkingHours(howManyTimeTake2);
          
          return result;
        }
        
        return "0h 0m";
      }
    }

    
    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in calculateTimeDifference:", error);
    return "0h 0m";
  }
};

// Calculate difference considering working hours (10:00 AM - 06:00 PM, Monday to Saturday)
export const calculateWorkingHoursDifference = (startTimeStr, endTimeStr) => {
  try {
    
    
    

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    
    

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      
      return "0h 0m";
    }

    // Ensure start is before end
    if (startTime >= endTime) {
      
      return "0h 0m";
    }

    let totalWorkingMinutes = 0;
    const workStartHour = 10;  // 10:00 AM
    const workEndHour = 18;     // 06:00 PM
    const workingHoursPerDay = workEndHour - workStartHour; // 8 hours

    let currentDate = new Date(startTime);

    // Calculate difference in days
    const diffTime = Math.abs(endTime - startTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    

    // Loop through each day
    for (let day = 0; day <= diffDays; day++) {
      const dayDate = new Date(startTime);
      dayDate.setDate(startTime.getDate() + day);

      // 🔥 NEW: Check if it's Sunday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek === 0) {
        
        continue; // Skip Sunday
      }

      const dayStart = new Date(dayDate);
      dayStart.setHours(workStartHour, 0, 0, 0);

      const dayEnd = new Date(dayDate);
      dayEnd.setHours(workEndHour, 0, 0, 0);

      // Calculate actual working time for this day
      const actualStart = new Date(Math.max(startTime.getTime(), dayStart.getTime()));
      const actualEnd = new Date(Math.min(endTime.getTime(), dayEnd.getTime()));

      if (actualStart < actualEnd && actualStart < dayEnd && actualEnd > dayStart) {
        const dayMinutes = (actualEnd - actualStart) / (1000 * 60);

        // Ensure we don't exceed 8 hours (480 minutes) per day
        const cappedMinutes = Math.min(dayMinutes, workingHoursPerDay * 60);

        totalWorkingMinutes += cappedMinutes;
        
      }
    }

    

    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const minutes = Math.floor(totalWorkingMinutes % 60);

    // Convert to days and hours (8-hour working day)
    const days = Math.floor(totalHours / 8);    // 8 घंटे = 1 working day
    const hours = totalHours % 8;               // Remaining hours

    let result;
    if (days > 0) {
      result = `${days}d ${hours}h ${minutes}m`;
    } else {
      result = `0d ${hours}h ${minutes}m`;
    }

    
    return result;

  } catch (error) {
    console.error("❌ Error in calculateWorkingHoursDifference:", error);
    return "0h 0m";
  }
};

// Format time with working hours consideration
export const formatTimeWithWorkingHours = (timeStr) => {
  try {
    

    if (!timeStr || timeStr.toString().trim() === "") {
      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // Already in "Xh Ym" format
    if (str.includes('h') && str.includes('m')) {
      
      return str;
    }

    // Handle "X days" format
    if (str.toLowerCase().includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const hours = days * 8; // 8 working hours per day
        return `${hours}h 0m`;
      }
    }

    // Plain number (assume hours)
    if (/^\d+(\.\d+)?$/.test(str)) {
      const hours = parseFloat(str);
      const h = Math.floor(hours);
      const m = Math.floor((hours % 1) * 60);
      return `${h}h ${m}m`;
    }

    // Date string
    if (str.includes('T') || str.includes('-')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        return calculateWorkingHoursDifference(str, now.toISOString());
      }
    }

    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in formatTimeWithWorkingHours:", error);
    return "0h 0m";
  }
};

// Helper function to parse time string to minutes
export const parseTimeStringToMinutes = (timeStr) => {
  let totalMinutes = 0;

  // Extract hours
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }

  // Extract minutes
  const minutesMatch = timeStr.match(/(\d+)\s*m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }

  // If no h/m found but it's a number, assume hours
  if (totalMinutes === 0 && /^\d+$/.test(timeStr)) {
    totalMinutes = parseInt(timeStr) * 60;
  }

  return totalMinutes;
};

// Helper function to format minutes to "Xh Ym" format
export const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h 0m`;
  } else {
    return `0h ${minutes}m`;
  }
};

// Helper function to check if value is a valid date
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;

  const str = dateStr.toString().trim();

  // Check if it's a name (contains letters but not date patterns)
  if (/^[a-zA-Z\s]+$/.test(str)) {
    return false;
  }

  // Check if it's a date string (contains date patterns)
  if (str.includes('T') || str.includes('-') || str.includes('/')) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }

  return false;
};

// Helper function to check if value is a time format
export const isTimeFormat = (timeStr) => {
  if (!timeStr) return false;

  const str = timeStr.toString().trim();

  // Check for patterns like "Xh Ym", "X hours", "X days", etc.
  if (/(\d+\s*(h|hours?|hrs?))|(\d+\s*(d|days?))|(\d+\s*(m|min|minutes?))/i.test(str)) {
    return true;
  }

  // Check for simple numbers (assume they are hours)
  if (/^\d+$/.test(str)) {
    return true;
  }

  return false;
};

// Helper function to calculate difference between two dates
export const calculateDifference = (dateStr1, dateStr2) => {
  try {
    

    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      
      return "0h 0m";
    }

    const timeDifferenceMs = Math.abs(date1.getTime() - date2.getTime());
    const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

    return formatMinutesToDays(totalMinutes);
  } catch (error) {
    console.error("Error in calculateDifference:", error);
    return "0h 0m";
  }
};

// Enhanced helper function to format time spent from string with days
export const formatTimeSpent = (timeStr) => {
  try {
    

    if (!timeStr) {
      
      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // If it's already in proper format with days/hours/minutes, return as is
    if ((str.includes('day') || str.includes('d')) && str.includes('h') && str.includes('m')) {
      
      return formatToDaysHoursMinutes(str);
    }

    // If it's already in "Xh Ym" format, convert to days format
    if (str.includes('h') && str.includes('m')) {
      
      return convertHoursMinutesToDays(str);
    }

    // Handle simple numbers (assume they are hours)
    if (/^\d+$/.test(str)) {
      const totalHours = parseInt(str);
      
      return formatHoursToDays(totalHours);
    }

    // Handle "X days" format
    if (str.includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        
        return `${days}day${days !== 1 ? 's' : ''} 0h 0m`;
      }
    }

    // Handle "X hours" format
    if (str.includes('hour')) {
      const hoursMatch = str.match(/(\d+)\s*hours?/i);
      if (hoursMatch) {
        const totalHours = parseInt(hoursMatch[1]);
        
        return formatHoursToDays(totalHours);
      }
    }

    // Handle "X hours Y minutes" format
    const hoursMinutesMatch = str.match(/(\d+)\s*h\s*(\d+)\s*m/i) ||
      str.match(/(\d+)\s*hours?\s*(\d+)\s*minutes?/i);
    if (hoursMinutesMatch) {
      const hours = parseInt(hoursMinutesMatch[1]);
      const minutes = parseInt(hoursMinutesMatch[2]);
      
      const totalHours = hours + (minutes / 60);
      return formatHoursToDays(totalHours);
    }

    // If it's a date string, calculate difference from current time
    if (str.includes('T')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const timeDifferenceMs = Math.abs(now.getTime() - date.getTime());
        const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
        return formatMinutesToDays(totalMinutes);
      }
    }

    
    return "0h 0m";
  } catch (error) {
    console.error("Error in formatTimeSpent:", error);
    return "0h 0m";
  }
};

// Helper function to format hours into days, hours, minutes
export const formatHoursToDays = (totalHours) => {
  const days = Math.floor(totalHours / 24);
  const remainingHours = Math.floor(totalHours % 24);
  const minutes = Math.floor((totalHours * 60) % 60);

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${remainingHours}h${minutes}m`;
  } else {
    return `0day ${remainingHours}h ${minutes}m`;
  }
};

// Helper function to format minutes into days, hours, minutes
export const formatMinutesToDays = (totalMinutes) => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Helper function to convert existing "Xh Ym" format to days format
export const convertHoursMinutesToDays = (timeStr) => {
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const totalHours = hours + (minutes / 60);
  return formatHoursToDays(totalHours);
};

// Helper function to format existing days/hours/minutes string
export const formatToDaysHoursMinutes = (timeStr) => {
  const daysMatch = timeStr.match(/(\d+)\s*day/);
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Fixed date format function for ISO dates
export const formatDateToDDMMYY = (dateInput) => {
  if (!dateInput || dateInput.toString().trim() === "") {
    return "No assign date";
  }

  try {
    const dateStr = dateInput.toString().trim();

    // Handle ISO date format (2025-05-03T00:00:00+00:00)
    if (dateStr.includes('T') && dateStr.includes('-')) {
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        return dateStr; // Return original if parsing fails
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());

      return `${day}/${month}/${year}`;
    }

    // Handle other date formats (existing logic)
    let date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[2].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[0];
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (!isNaN(dateStr) && dateStr.length > 4) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = parseInt(dateStr);
      date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateInput);
    return dateInput.toString().trim();
  }
};

// UPDATED: Process team data from Supabase with dynamic team name lookup
export const processTeamDataFromSupabase = async (supabaseData, userRole = "admin") => {
  if (userRole !== "admin") {
    
    return [];
  }

  if (!supabaseData || !Array.isArray(supabaseData)) {
    
    return [];
  }

  const teamMap = new Map();

  // Sort data by timestamp or id to get latest entries first
  const sortedData = [...supabaseData].sort((a, b) => {
    const timeA = a.timestamp || a.id || 0;
    const timeB = b.timestamp || b.id || 0;
    return timeB - timeA;
  });

  
  
  

  let processedCount = 0;
  let skippedCount = 0;

  // 🔥 NEW: Process all items and collect unique member names first
  for (const item of sortedData) {
    const teamMember = item.team_member_name?.trim().toLowerCase();
    const employeeName = item.employee_name_1?.trim().toLowerCase();

    let memberName = teamMember;
    if (teamMember && teamMember.includes("team") && employeeName) {
      memberName = employeeName;
    }

    if (!memberName) {
      skippedCount++;
      continue;
    }

    // 🔥 NEW: Fetch team name dynamically from dropdown table
    if (!teamMap.has(memberName)) {
      const dynamicTeamName = await fetchTeamNameFromDropdown(memberName);
      
      const assignDate = item.given_date || item.timestamp || item.actual1;
      const timeSpent = calculateTimeDifference(item);

      teamMap.set(memberName, {
        id: teamMap.size + 1,
        name: memberName,
        teamName: dynamicTeamName, // 🔥 Using dynamic team name from dropdown
        avatar: memberName.charAt(0).toUpperCase(),
        assignDate: assignDate ? formatDateToDDMMYY(assignDate) : "No assign date",
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        status: "available",
        nearestFutureDate: null,
        latestAssignDate: assignDate,
        timeSpent: timeSpent,
      });

      
    }

    processedCount++;

    const member = teamMap.get(memberName);
    member.totalTasks++;

    const plannedData = item.planned3;
    const actualData = item.actual3;

    const plannedHasData = plannedData && plannedData.toString().trim() !== "";
    const actualHasData = actualData && actualData.toString().trim() !== "";

    if (plannedHasData && actualHasData) {
      member.completedTasks++;
      
    } else if (plannedHasData && !actualHasData) {
      member.pendingTasks++;
      

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const planned3Date = new Date(plannedData);

      if (!isNaN(planned3Date.getTime())) {
        planned3Date.setHours(0, 0, 0, 0);

        if (planned3Date > today) {
          const futureDate = formatDateToDDMMYY(plannedData);
          

          if (!member.nearestFutureDate || planned3Date < member.nearestFutureDate) {
            member.nearestFutureDate = planned3Date;
            
          }
        }
      }

      const currentTimeMinutes = parseTimeStringToMinutes(member.timeSpent);
      const newTimeMinutes = parseTimeStringToMinutes(calculateTimeDifference(item));

      if (newTimeMinutes > currentTimeMinutes) {
        member.timeSpent = calculateTimeDifference(item);
      }
    } else if (!plannedHasData && actualHasData) {
      member.completedTasks++;
    }

    // Update assign date
    if (item.given_date || item.timestamp || item.actual1) {
      const assignDate = item.given_date || item.timestamp || item.actual1;
      const currentDate = new Date(member.latestAssignDate || 0);
      const newDate = new Date(assignDate);

      if (!member.latestAssignDate || newDate > currentDate) {
        member.assignDate = formatDateToDDMMYY(assignDate);
        member.latestAssignDate = assignDate;
      }
    }
  }

  
  
  

  teamMap.forEach((member, name) => {
    if (member.nearestFutureDate) {
      member.status = formatDateToDDMMYY(member.nearestFutureDate);
    } else {
      member.status = "available";
    }

    
    
    
  });

  const teamMembers = Array.from(teamMap.values()).map((member) => ({
    ...member,
    tasksAssigned: member.pendingTasks,
    tasksCompleted: member.completedTasks,
    totalTasksGiven: member.totalTasks,
    completionRate: member.totalTasks
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0,
    timeSpent: member.timeSpent || "0h 0m",
  }));

  
  

  return teamMembers;
};


// NEW: Helper function to fetch team name from dropdown table
export const fetchTeamNameFromDropdown = async (memberName) => {
  try {
    if (!memberName || memberName.trim() === "") {
      return "No Team";
    }

    const lowerName = memberName.trim().toLowerCase();

    const { data, error } = await supabase
      .from("dropdown")
      .select("team_name, member_name")
      .ilike("member_name", lowerName); // case-insensitive match

    if (error || !data || data.length === 0) {
      
      return "No Team";
    }

    return data[0]?.team_name || "No Team";
  } catch (error) {
    console.error("Error fetching team name from dropdown:", error);
    return "No Team";
  }
};


// Process project data from Supabase (unchanged from your version)
export const processProjectData = (supabaseData, userRole = "admin") => {
  if (userRole !== "admin") {
    return [];
  }

  if (!supabaseData || !Array.isArray(supabaseData)) {
    return [];
  }

  const determineStage = (record) => {
    const { planned1, actual1, planned2, actual2, planned3, actual3 } = record;

    const hasData = (field) => field && field.toString().trim() !== "";
    const isEmpty = (field) => !field || field.toString().trim() === "";

    if (hasData(planned1) && isEmpty(actual1)) {
      return "Stage 1";
    }

    if (
      hasData(planned1) &&
      hasData(actual1) &&
      hasData(planned2) &&
      isEmpty(actual2)
    ) {
      return "Stage 2";
    }

    if (
      hasData(planned2) &&
      hasData(actual2) &&
      hasData(planned3) &&
      isEmpty(actual3)
    ) {
      return "Stage 3";
    }

    if (hasData(planned3) && hasData(actual3)) {
      return "Completed";
    }

    return "Not Started";
  };

  const projectData = [];
  let processedCount = 0;

  supabaseData.forEach((record, index) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const taskNo = record.task_no;
    const descriptionOfWork = record.description_of_work;

    if (
      (!taskNo || taskNo.toString().trim() === "") &&
      (!descriptionOfWork || descriptionOfWork.toString().trim() === "")
    ) {
      return;
    }

    processedCount++;

    const postedBy = record.posted_by;
    const typeOfWork = record.type_of_work;
    const takenFrom = record.taken_from;
    const partyName = record.party_name;
    const systemName = record.system_name;

    const currentStage = determineStage(record);

    const projectItem = {
      id: record.id || processedCount,
      taskNo: taskNo ? taskNo.toString().trim() : `Task-${processedCount}`,
      postedBy: postedBy ? postedBy.toString().trim() : "N/A",
      typeOfWork: typeOfWork ? typeOfWork.toString().trim() : "N/A",
      takenFrom: takenFrom ? takenFrom.toString().trim() : "N/A",
      partyName: partyName ? partyName.toString().trim() : "N/A",
      systemName: systemName ? systemName.toString().trim() : "N/A",
      descriptionOfWork: descriptionOfWork
        ? descriptionOfWork.toString().trim()
        : "N/A",
      stage1:
        currentStage === "Stage 1"
          ? "Active"
          : currentStage === "Stage 2" ||
            currentStage === "Stage 3" ||
            currentStage === "Completed"
            ? "Completed"
            : "Pending",
      stage2:
        currentStage === "Stage 2"
          ? "Active"
          : currentStage === "Stage 3" || currentStage === "Completed"
            ? "Completed"
            : "Pending",
      stage3:
        currentStage === "Stage 3"
          ? "Active"
          : currentStage === "Completed"
            ? "Completed"
            : "Pending",
      currentStage: currentStage,
      priority: "Normal",
      planned1: record.planned1 || "",
      actual1: record.actual1 || "",
      planned2: record.planned2 || "",
      actual2: record.actual2 || "",
      planned3: record.planned3 || "",
      actual3: record.actual3 || "",
      timestamp: record.timestamp || "",
      givenDate: record.given_date || "",
      status: record.status || "",
      teamName: record.team_name || "",
      assignedBy: record.assigned_by || "",
    };

    projectData.push(projectItem);
  });

  return projectData;
};
