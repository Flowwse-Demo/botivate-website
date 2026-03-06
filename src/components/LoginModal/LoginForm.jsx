
import React from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, User } from "lucide-react"
import Button from "./Button"

const LoginForm = ({
  loginType,
  formData,
  error,
  isLoading,
  showPassword,
  onSubmit,
  onInputChange,
  onTogglePassword,
}) => {
  return (
    <motion.form
      onSubmit={onSubmit}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
            required
            className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={onTogglePassword}
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
  )
}

export default LoginForm
