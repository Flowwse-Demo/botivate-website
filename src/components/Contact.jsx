"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"
import ProfileCard from "./ProfileCard"
import vikasImage from "../components/images/vikas.png"
import chetanImage from "../components/images/chetan.png"
import satyendraImage from "../components/images/satyendra.png"

const teamMembers = [
  {
    name: "Satyendra Tandan",
    title: "Founder",
    handle: "satyendra",
    status: "Online",
    avatarUrl: satyendraImage,
    contactText: "Contact Me",
  },
  {
    name: "Chetan Sahu",
    title: "Manager",
    handle: "chetansahu",
    status: "Online",
    avatarUrl: chetanImage,
    contactText: "Get in Touch",
  },
  {
    name: "Marcus Johnson",
    title: "Software engineer",
    handle: "vikas",
    status: "Online",
    avatarUrl: vikasImage,
    contactText: "Schedule Call",
  },
  {
    name: "Emily Davis",
    title: "Customer Success Manager",
    handle: "emilysuccess",
    status: "Available",
    avatarUrl: "/placeholder.svg?height=300&width=300",
    contactText: "Let's Talk",
  },
  {
    name: "David Kim",
    title: "Machine Learning Engineer",
    handle: "davidml",
    status: "Online",
    avatarUrl: "/placeholder.svg?height=300&width=300",
    contactText: "Connect",
  },
  {
    name: "Lisa Wang",
    title: "Business Intelligence Lead",
    handle: "lisabi",
    status: "Available",
    avatarUrl: "/placeholder.svg?height=300&width=300",
    contactText: "Reach Out",
  },
]

export default function Contact() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const scrollContainerRef = useRef(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      })
    }
  }

  return (
    <section id="contact" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/30 to-black" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Experts
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Connect with our team of automation specialists ready to transform your business with cutting-edge AI
            solutions
          </p>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={scrollLeft}
              className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-purple-400 transition-colors" />
            </button>
            <div className="text-sm text-gray-400">Scroll to explore our team</div>
            <button
              onClick={scrollRight}
              className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-purple-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Cards Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex space-x-8 overflow-x-auto scrollbar-hide pb-8 px-4"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.handle}
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <ProfileCard
                  name={member.name}
                  title={member.title}
                  handle={member.handle}
                  status={member.status}
                  contactText={member.contactText}
                  avatarUrl={member.avatarUrl}
                  enableTilt={true}
                  onContactClick={() => { }}
                />
              </motion.div>
            ))}
          </div>

          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h3>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Schedule a consultation with our experts and discover how AI automation can revolutionize your business
              operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105">
                Schedule Free Consultation
              </button>
              <button className="border border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 bg-transparent">
                View Case Studies
              </button>
            </div>
          </div>
        </motion.div>

        {/* Custom CSS for hiding scrollbar */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}