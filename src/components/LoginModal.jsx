


"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Eye, EyeOff, User, Shield, Building2 } from "lucide-react"
import supabase from "../supabaseClient"

// Button component
const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [loginType, setLoginType] = useState("company") // "user", "admin", "company"
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Cookie utility functions
// const setCookie = (name, value, days) => {
//   const expires = new Date();
//   expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//   document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
// };

// const getCookie = (name) => {
//   const nameEQ = name + "=";
//   const ca = document.cookie.split(';');
//   for (let i = 0; i < ca.length; i++) {
//     let c = ca[i];
//     while (c.charAt(0) === ' ') c = c.substring(1, c.length);
//     if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
//   }
//   return null;
// };

// const deleteCookie = (name) => {
//   document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
// };

// JWT utility functions
const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production-123"; // Production mein env variable se lo

const createJWT = (payload) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  
  // Simple signature
  const signature = btoa(
    Array.from(base64Header + '.' + base64Payload)
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ JWT_SECRET.charCodeAt(i % JWT_SECRET.length)))
      .join('')
  );
  
  return `${base64Header}.${base64Payload}.${signature}`;
};

const verifyJWT = (token) => {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = btoa(
      Array.from(header + '.' + payload)
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ JWT_SECRET.charCodeAt(i % JWT_SECRET.length)))
        .join('')
    );
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    return JSON.parse(atob(payload));
  } catch (e) {
    console.error("JWT verification failed:", e);
    return null;
  }
};

const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const jwt = createJWT(value); // JWT create karo
  document.cookie = `${name}=${jwt};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const jwt = c.substring(nameEQ.length, c.length);
      return verifyJWT(jwt); // JWT verify aur decode karo
    }
  }
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

  // Check for existing session on component mount
// Check for existing session on component mount
// useEffect(() => {
//   const session = getCookie('userSession')
//   if (session) {
//     try {
//       const userData = JSON.parse(session)
//       onLogin(userData.role, userData.username, userData.pagination, userData.filterData, userData.companyData)
//     } catch (e) {
//       console.error("Error parsing session data:", e)
//       deleteCookie('userSession')
//     }
//   }
// }, [onLogin])

useEffect(() => {
  const session = getCookie('userSession'); // Directly decoded object milega
  if (session) {
    try {
      onLogin(session.role, session.username, session.pagination, session.filterData, session.companyData);
    } catch (e) {
      console.error("Error parsing session data:", e);
      deleteCookie('userSession');
    }
  }
}, [onLogin])

  // Function to validate admin credentials
const validateAdminCredentials = (username, password) => {
  const adminCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'superadmin', password: 'super123' },
  ];

  return adminCredentials.some(
    admin => admin.username === username && admin.password === password
  );
};
  // Function to get Master Sheet and FMS data for user filtering
  const getUserFilterData = async (username, role) => {
    // console.log('🔍 Starting user validation for:', username, 'role:', role);

    if (role === 'admin') {
      // Admin sees all data, no filtering needed
      // console.log('✅ Admin user detected, granting full access');
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
      // console.log('📊 Fetching Master Sheet and FMS data...');

      // Try to fetch FMS data first (we know this endpoint works)
      const fmsData = await fetchFMSData();

      // For now, let's use FMS data for both validations since Master Sheet endpoint might not exist
      // You can add the Master Sheet endpoint to your Google Apps Script later
      let masterSheetData = null;

      try {
        masterSheetData = await fetchMasterSheetData();
      } catch (masterError) {
        // console.log('⚠️ Master Sheet endpoint not available, using FMS data only');
        // Fallback: use FMS data for validation
        masterSheetData = fmsData;
      }

      if (!masterSheetData || !fmsData) {
        // console.log('❌ Failed to fetch sheet data');
        // console.log('Master Sheet Data:', !!masterSheetData);
        // console.log('FMS Data:', !!fmsData);
        return {
          isAdmin: false,
          userExists: false,
          showAllData: false,
          userRowData: null,
          userRowIndex: -1,
          message: 'Failed to fetch sheet data'
        }
      }

      // console.log('📋 Master Sheet rows:', masterSheetData.length);
      // console.log('📋 FMS rows:', fmsData.length);

      // Find user in Master Sheet Link (Column J - index 9) OR FMS Column X (index 23)
      // console.log('🔍 Searching for user in sheets...');
      let userMasterIndex = -1;

      // First try to find in Master Sheet Column J
      if (masterSheetData && masterSheetData !== fmsData) {
        userMasterIndex = masterSheetData.findIndex((row, index) => {
          const cellValue = row[9] ? row[9].toString().trim().toLowerCase() : '';
          const match = cellValue === username.trim().toLowerCase();
          if (match) {
            // console.log(`✅ Found user in Master Sheet at row ${index + 1}, Column J:`, cellValue);
          }
          return match;
        });
      }

      // If not found in Master Sheet or Master Sheet not available, try FMS Column X
      if (userMasterIndex === -1) {
        // console.log('🔍 Searching in FMS Column X...');
        userMasterIndex = fmsData.findIndex((row, index) => {
          const cellValue = row[23] ? row[23].toString().trim().toLowerCase() : '';
          const match = cellValue === username.trim().toLowerCase();
          if (match) {
            // console.log(`✅ Found user in FMS at row ${index + 1}, Column X:`, cellValue);
          }
          return match;
        });
      }

      if (userMasterIndex === -1) {
        // console.log('❌ User not found in any sheet');
        // Debug: show some sample values
        // console.log('🔍 Sample FMS Column X values:',
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
      // console.log(`🔍 Checking FMS sheet at row ${userMasterIndex + 1}...`);
      const fmsRow = fmsData[userMasterIndex];

      if (!fmsRow) {
        // console.log('❌ No corresponding row in FMS sheet');
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
      // console.log('📍 FMS Column X value:', columnXValue);

      if (columnXValue !== username.trim().toLowerCase()) {
        // console.log('❌ Username mismatch in FMS Column X');
        // console.log('Expected:', username.trim().toLowerCase());
        // console.log('Found in FMS Column X:', columnXValue);

        // If user was found by Column X search, this shouldn't happen, but let's continue anyway
        if (columnXValue === '') {
          // console.log('⚠️ Column X is empty, but user was found. Continuing with validation...');
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
      // console.log('📍 FMS Column AE (status):', statusAE);

      let shouldShowUserData = false;
      let userRowIndex = userMasterIndex;
      let assignedColumn = 'X';

      if (statusAE === 'forward2') {
        // console.log('🔄 Status is forward2, checking Column Y...');
        // If status is forward2, check Column Y (index 24) for username match
        const columnY = fmsRow[24] ? fmsRow[24].toString().trim().toLowerCase() : '';
        // console.log('📍 FMS Column Y value:', columnY);

        if (columnY === username.trim().toLowerCase()) {
          // console.log('✅ User matches forward2 assignment in Column Y');
          shouldShowUserData = true;
          assignedColumn = 'Y';
        } else {
          // console.log('❌ User does not match forward2 assignment');
          // console.log('Expected in Column Y:', username.trim().toLowerCase());
          // console.log('Found in Column Y:', columnY);
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
        // console.log('✅ Status is not forward2, using Column X assignment');
        // For any status other than forward2, use Column X (already validated above)
        shouldShowUserData = true;
        assignedColumn = 'X';
      }

      if (shouldShowUserData) {
        // console.log(`✅ User validation successful! Using Column ${assignedColumn}`);
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

      // console.log('❌ User validation failed for unknown reason');
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
  const getCompanyData = async (companyId, password) => {
    // console.log('🏢 Starting company validation for:', companyId);

    try {
      // Fetch Master Sheet Link data
      // console.log('📊 Fetching Master Sheet Link data for company validation...');
      const masterSheetData = await fetchMasterSheetLinkData();

      if (!masterSheetData) {
        // console.log('❌ Failed to fetch Master Sheet Link data');
        return {
          isCompany: false,
          companyExists: false,
          companyRowData: null,
          companyRowIndex: -1,
          message: 'Failed to fetch company data'
        }
      }

      // console.log('📋 Master Sheet Link rows:', masterSheetData.length);

      // Find company in Master Sheet Link
      // Column A (index 0) = ID
      // Column B (index 1) = Password  
      // console.log('🔍 Searching for company in Master Sheet Link...');

      const companyIndex = masterSheetData.findIndex((row, index) => {
        const idValue = row[0] ? row[0].toString().trim().toLowerCase() : '';
        const passwordValue = row[1] ? row[1].toString().trim() : '';

        const idMatch = idValue === companyId.trim().toLowerCase();
        const passwordMatch = passwordValue === password.trim();

        const allMatch = idMatch && passwordMatch;

        if (allMatch) {
          // console.log(`✅ Found company at row ${index + 1}:`);
          // console.log('- ID:', idValue);
          // console.log('- Password matches:', passwordMatch);
        }

        return allMatch;
      });

      if (companyIndex === -1) {
        // console.log('❌ Company not found or credentials do not match');
        // Debug: show some sample values
        // console.log('🔍 Sample Master Sheet Link values:',
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

      // console.log('📍 Company paginationnew (Column E):', paginationNew);

      // console.log('✅ Company validation successful!');
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

  // Fetch Master Sheet Link data (for company login)
  const fetchMasterSheetLinkData = async () => {
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
      // console.log('📋 Master Sheet Link API response:', data);
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
        // console.log('📋 Master Sheet Link API fallback response:', data);
        return data.success ? data.data : null
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError)
        return null
      }
    }
  }

  // Fetch Master Sheet data
  const fetchMasterSheetData = async () => {
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
      // console.log('📋 Master Sheet API response:', data);
      return data.success ? data.data : null
    } catch (error) {
      console.error("Error fetching master sheet data:", error)
      return null
    }
  }

  // Fetch FMS sheet data - using the existing working endpoint
  const fetchFMSData = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec?sheet=FMS&timestamp=${timestamp}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // console.log('📋 FMS API response:', data);
      return data.success ? data.data : null
    } catch (error) {
      console.error("Error fetching FMS data:", error)
      return null
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const startLogoutTimer = () => {
  // 12 hours = 12 * 60 * 60 * 1000 milliseconds
  const LOGOUT_TIME = 12 * 60 * 60 * 1000;
  
  const timer = setTimeout(() => {
    // Logout user
    deleteCookie('userSession');
    onClose(); // Modal band karo
    setFormData({ username: "", password: "" });
    setError("Your session has expired. Please login again.");
    // Agar tum chahte ho page reload karna to:
    // window.location.reload();
  }, LOGOUT_TIME);

  // Store timer ID taki cancel kar sake agar logout se pehle user logout kare
  sessionStorage.setItem('logoutTimerId', timer);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    // console.log("🔐 Starting login process for:", loginType, formData.username);

    // ✅ Admin login
    if (loginType === "admin") {
      const { data, error } = await supabase
        .from("master")
        .select("user_id, user_role, pagination_for_user, user_password")
        .eq("user_id", formData.username)
        .eq("user_password", formData.password)
        .eq("user_role", "admin")
        .single();

      if (error || !data) {
        throw new Error("Invalid admin credentials.");
      }

      // Ensure pagination is properly formatted
      let paginationData = data.pagination_for_user;
      
      // If pagination is a string, try to parse it as JSON
      if (typeof paginationData === 'string') {
        try {
          paginationData = JSON.parse(paginationData);
        } catch (parseError) {
          console.warn("Could not parse pagination as JSON, using as string:", paginationData);
        }
      }

      const sessionData = {
        role: "company",
        username: formData.username,     // company_id
        pagination: paginationData,
        filterData: null,
        companyData: {
          companyId: data.company_id,
          companyName: data.company_name,   // <-- THIS is needed
          paginationNew: paginationData || null
        }
      };
      // sessionStorage.setItem("userSession", JSON.stringify(sessionData));
      // setCookie("userSession", JSON.stringify(sessionData), 7); // 7 days expiry
      setCookie("userSession", sessionData, 7);
startLogoutTimer(); // ✅ Add ye line
onLogin("admin", formData.username, sessionData.pagination, sessionData.filterData, null);
return;
    }

    // ✅ User login
    if (loginType === "user") {
      const { data, error } = await supabase
        .from("master")
        .select("user_id, user_role, pagination_for_user, user_password")
        .eq("user_id", formData.username)
        .eq("user_password", formData.password)
        .eq("user_role", "user")
        .single();

      if (error || !data) {
        throw new Error("Invalid user credentials.");
      }

      // Ensure pagination is properly formatted
      let paginationData = data.pagination_for_user;
      
      // If pagination is a string, try to parse it as JSON
      if (typeof paginationData === 'string') {
        try {
          paginationData = JSON.parse(paginationData);
        } catch (parseError) {
          console.warn("Could not parse pagination as JSON, using as string:", paginationData);
        }
      }

      const sessionData = {
        role: "user",
        username: formData.username,
        pagination: paginationData, // This could be object or string
        filterData: {
          username: formData.username,
          name: formData.username,
          userExists: true,
          isAdmin: false,
          showAllData: false,
          ...(data.filter_data || {})
        },
        companyData: null
      };
      // sessionStorage.setItem("userSession", JSON.stringify(sessionData));
      // setCookie("userSession", JSON.stringify(sessionData), 7); // 7 days expiry
      setCookie("userSession", sessionData, 7);
startLogoutTimer(); // ✅ Add ye line
onLogin("user", formData.username, sessionData.pagination, sessionData.filterData, null);
return;
    }

    // ✅ Company login
    if (loginType === "company") {

      const { data, error } = await supabase
        .from("master")
        .select("company_id, company_password, company_name, pagination_for_company")
        .eq("company_id", formData.username)
        .eq("company_password", formData.password)
        .single();

      if (error || !data) {
        throw new Error("Invalid company credentials.");
      }

      // ✅ NOW data is available — SAFE TO USE
      localStorage.setItem("company_name", data.company_name);
      console.log("LOGIN company_name saved:", data.company_name);

      let paginationData = data.pagination_for_company;

      if (typeof paginationData === "string") {
        try {
          paginationData = JSON.parse(paginationData);
        } catch {
          console.warn("Pagination not JSON, using raw value");
        }
      }

      const sessionData = {
        role: "company",
        username: formData.username,
        pagination: paginationData,
        filterData: null,
        companyData: {
          companyId: data.company_id,
          companyName: data.company_name,
          paginationNew: paginationData || null,
        },
      };

      setCookie("userSession", sessionData, 7);
      startLogoutTimer();

      onLogin(
        "company",
        formData.username,
        sessionData.pagination,
        null,
        sessionData.companyData
      );

      return;
    }

    throw new Error("Invalid login type specified.");
  } catch (error) {
    console.error("❌ Login error:", error);
    setError(error.message || "Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const resetForm = () => {
    setFormData({ username: "", password: "" })
    setError("")
  }

  const handleLoginTypeChange = (type) => {
    setLoginType(type)
    resetForm()
  }

  return (
   <AnimatePresence mode="wait">
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="relative p-6 pb-0">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={20} />
            </motion.button>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to your account</p>
            </motion.div>
          </div>

          {/* Login Type Selector */}
          <motion.div
            className="px-6 pb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => handleLoginTypeChange("company")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === "company"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Building2 size={16} className="inline mr-2" />
                Company
              </button>
              <button
                onClick={() => handleLoginTypeChange("admin")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === "admin"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Shield size={16} className="inline mr-2" />
                Admin
              </button>
              <button
                onClick={() => handleLoginTypeChange("user")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === "user"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <User size={16} className="inline mr-2" />
                User
              </button>
            </div>
          </motion.div>

              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                className="p-6 pt-2 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Username/ID Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-300">
                    {loginType === "company" ? "Company ID" : loginType === "admin" ? "Admin Username" : "Username"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder={
                        loginType === "company" 
                          ? "Enter company ID" 
                          : loginType === "admin" 
                            ? "Enter admin username" 
                            : "Enter your username"
                      }
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

             

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-3 font-semibold transition-all duration-200 ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
                >
                  {isLoading ? "Signing In..." : `Sign In as ${loginType === "company" ? "Company" : loginType === "admin" ? "Admin" : "User"}`}
                </Button>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-gray-400">
                    Don't have an account?{" "}
                    <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                      Sign up
                    </a>
                  </p>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}