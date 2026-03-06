"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import supabase from "../../supabaseClient"
import { setCookie, getCookie, deleteCookie } from "../../utils/jwt"
import LoginTypeSelector from "./LoginTypeSelector"
import LoginForm from "./LoginForm"

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [loginType, setLoginType] = useState("company") // "user", "admin", "company"
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const resetForm = () => {
    setFormData({ username: "", password: "" })
    setError("")
  }

  const handleLoginTypeChange = (type) => {
    setLoginType(type)
    resetForm()
  }

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {

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
        role: "admin",
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
          <LoginTypeSelector
            loginType={loginType}
            onLoginTypeChange={handleLoginTypeChange}
          />

              {/* Form */}
              <LoginForm
                loginType={loginType}
                formData={formData}
                error={error}
                isLoading={isLoading}
                showPassword={showPassword}
                onSubmit={handleSubmit}
                onInputChange={handleInputChange}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
