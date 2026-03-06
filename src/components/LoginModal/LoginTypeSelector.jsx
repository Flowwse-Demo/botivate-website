
import React from "react"
import { motion } from "framer-motion"
import { Building2, Shield, User } from "lucide-react"

const LoginTypeSelector = ({ loginType, onLoginTypeChange }) => {
  return (
    <motion.div
      className="px-6 pb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
    >
      <div className="flex bg-white/5 rounded-lg p-1">
        <button
          onClick={() => onLoginTypeChange("company")}
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
          onClick={() => onLoginTypeChange("admin")}
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
          onClick={() => onLoginTypeChange("user")}
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
  )
}

export default LoginTypeSelector
