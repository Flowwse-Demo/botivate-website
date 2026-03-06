"use client"
import { useState } from "react"

import { motion } from "framer-motion"
import { Send, CheckCircle, Mail, User, MessageSquare, AlertCircle, Loader2 } from "lucide-react"

// Your Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec";

export default function ReadyToStart() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      setStatusMessage('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus('error');
      setStatusMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true)
    setSubmitStatus(null);

    try {
      // Prepare row data for Email-Send sheet
      // Column A: Timestamp, Column B: (empty), Column C: Name, Column D: Email, Column E: Message, Column F: Status
      const timestamp = new Date().toLocaleString();
      const rowData = [
        timestamp,        // Column A
        '',              // Column B (empty)
        formData.name,   // Column C
        formData.email,  // Column D  
        formData.message,// Column E
        'Processing'     // Column F
      ];

      const submitFormData = new FormData();
      submitFormData.append('sheetName', 'Email-Send');
      submitFormData.append('action', 'insert');
      submitFormData.append('rowData', JSON.stringify(rowData));

      

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: submitFormData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      

      if (result.success) {
        setSubmitStatus('success');
        setStatusMessage('Thank you! Your message has been submitted successfully. We\'ll get back to you within 24 hours.');
        setIsSubmitted(true);
        
        // Optional: Also send emails by calling the email action
        try {
          const emailFormData = new FormData();
          emailFormData.append('sheetName', 'Email-Send');
          emailFormData.append('action', 'submitContact');
          emailFormData.append('name', formData.name);
          emailFormData.append('email', formData.email);
          emailFormData.append('message', formData.message);

          await fetch(SCRIPT_URL, {
            method: 'POST',
            body: emailFormData
          });
        } catch (emailError) {
          console.warn('Email sending failed, but form was submitted:', emailError);
        }

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setSubmitStatus(null);
          setFormData({ name: "", email: "", message: "" });
        }, 3000);
        
      } else {
        throw new Error(result.error || 'Failed to submit form');
      }

    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      setStatusMessage('Sorry, there was an error submitting your message. Please try again or contact us directly at info@botivate.in');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error status when user starts typing
    if (submitStatus === 'error') {
      setSubmitStatus(null);
      setStatusMessage('');
    }
  }

  const techLogos = [
    { name: "AI", icon: "🤖", color: "from-blue-500 to-cyan-500" },
    { name: "Cloud", icon: "☁️", color: "from-purple-500 to-pink-500" },
    { name: "Analytics", icon: "📊", color: "from-green-500 to-emerald-500" },
    { name: "Security", icon: "🔒", color: "from-red-500 to-orange-500" },
    { name: "Mobile", icon: "📱", color: "from-indigo-500 to-purple-500" },
    { name: "Database", icon: "🗄️", color: "from-yellow-500 to-orange-500" },
  ]

  return (
    <section id="contact" className="relative py-20 md:py-32 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-cyan-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Ready to Get </span>
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Started?</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your business with cutting-edge AI solutions. Let's discuss how we can help you achieve your
            goals.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side - Tech Logos & Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Main Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl">
                    🚀
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Innovation Awaits</h3>
                  <p className="text-gray-300">Join 500+ companies already transforming with AI</p>
                </div>

                {/* Tech Stack Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {techLogos.map((tech, index) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      className={`relative group cursor-pointer`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${tech.color} rounded-lg opacity-20 group-hover:opacity-40 transition-opacity`}
                      />
                      <div className="relative bg-gray-800/50 border border-white/10 rounded-lg p-4 text-center group-hover:border-white/20 transition-colors">
                        <div className="text-2xl mb-2">{tech.icon}</div>
                        <div className="text-xs text-gray-300 font-medium">{tech.name}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "500+", label: "Projects" },
                { value: "98%", label: "Success Rate" },
                { value: "24/7", label: "Support" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-300">We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Let's Talk</h3>
                    <p className="text-gray-300">Tell us about your project and we'll get back to you.</p>
                  </div>

                  {/* Status Message */}
                  {submitStatus && !isSubmitted && (
                    <div className={`flex items-center space-x-2 p-4 rounded-xl ${
                      submitStatus === 'success' 
                        ? 'bg-green-900/20 border border-green-500/20 text-green-300' 
                        : 'bg-red-900/20 border border-red-500/20 text-red-300'
                    }`}>
                      {submitStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="text-sm">{statusMessage}</span>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your Email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project..."
                      required
                      rows={5}
                      className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}