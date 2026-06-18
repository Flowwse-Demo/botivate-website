import { useState, useEffect, lazy, Suspense } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { getCookie, deleteCookie } from "./utils/jwt"
import LoginModal from "./site/components/LoginModal"
import DashboardLayout from "./components/Layout/Layout"
import MarketingLayout from "./site/components/Layout"
import ScrollToTop from "./site/components/ScrollToTop"

const HomePage        = lazy(() => import("./site/pages/HomePage"))
const AboutPage       = lazy(() => import("./site/pages/AboutPage"))
const ServicesPage    = lazy(() => import("./site/pages/ServicesPage"))
const BotivateOSPage  = lazy(() => import("./site/pages/BotivateOSPage"))
const FrogPlannerPage = lazy(() => import("./site/pages/FrogPlannerPage"))
const MemoriesPage    = lazy(() => import("./site/pages/MemoriesPage"))
const CareersPage     = lazy(() => import("./site/pages/CareersPage"))

const FullScreenLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-gray-700 text-xl">Loading...</div>
  </div>
)

export default function AppRoutes() {
  const [user, setUser] = useState(null)
  const [userFilterData, setUserFilterData] = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const navigate = useNavigate()

  // Map a decoded session payload onto React state (admin always gets "all").
  const applySession = (session) => {
    setUser({
      type: session.role,
      username: session.username,
      pagination: session.role === "admin" ? "all" : session.pagination,
    })
    setUserFilterData(session.filterData ?? null)
    setCompanyData(session.companyData ?? null)
  }

  // Restore session from the JWT cookie on first load (no navigation, so a
  // logged-in user can still browse the marketing site).
  useEffect(() => {
    try {
      const session = getCookie("userSession")
      if (session && session.role) {
        applySession(session)
      }
    } catch (e) {
      console.error("Error restoring session:", e)
      deleteCookie("userSession")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Called by LoginModal on a successful login. The cookie is already written
  // by the modal; here we update state and route into the dashboard.
  const handleLogin = (role, username, pagination, filterData, companyInfo = null) => {
    let paginationValue = pagination
    if (typeof pagination === "object") {
      try {
        paginationValue = pagination
      } catch (e) {
        console.warn("Could not parse pagination, using as is:", pagination)
      }
    }
    const finalPagination = role === "admin" ? "all" : paginationValue

    const userData = { type: role, username, pagination: finalPagination }
    setUser(userData)
    setUserFilterData(filterData ?? null)
    setCompanyData(companyInfo ?? null)
    setIsLoginOpen(false)

    // Keep legacy storage in sync for any dashboard code that reads it.
    const sessionData = { role, username, pagination: finalPagination, filterData, companyData: companyInfo }
    sessionStorage.setItem("userSession", JSON.stringify(sessionData))
    localStorage.setItem("userData", JSON.stringify(userData))

    navigate("/dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setUserFilterData(null)
    setCompanyData(null)

    deleteCookie("userSession")
    deleteCookie("currentPage")
    sessionStorage.clear()
    localStorage.removeItem("user")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userData")
    localStorage.removeItem("role")
    localStorage.removeItem("company_name")

    navigate("/")
  }

  return (
    <>
      <ScrollToTop />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      <Suspense fallback={null}>
        <Routes>
          {/* Public marketing site */}
          <Route
            element={
              <MarketingLayout
                onLoginClick={() => setIsLoginOpen(true)}
                user={user}
              />
            }
          >
            <Route index element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/autorocket" element={<BotivateOSPage />} />
            <Route path="/frog-planner" element={<FrogPlannerPage />} />
            <Route path="/memories" element={<MemoriesPage />} />
            <Route path="/careers" element={<CareersPage />} />
          </Route>

          {/* Protected dashboard (the "inner section") */}
          <Route
            path="/dashboard"
            element={
              isLoading ? (
                <FullScreenLoader />
              ) : user ? (
                <DashboardLayout
                  user={user}
                  userFilterData={userFilterData}
                  companyData={companyData}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
