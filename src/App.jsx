"use client"
import { useState, useEffect } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import About from "./components/About"
import Services from "./components/Services"
import Testimonials from "./components/Testimonials"
import Counter from "./components/Counter"
import Features from "./components/Features"
import ReadyToStart from "./components/readyToStart"
import Footer from "./components/footer"
import WhatsAppChat from "./components/WhatsappChat"
import ProductsPage from "./components/ProductPage"
import ProblemSolution from "./components/ProblemSolution"
import VisionMission from "./components/VissionMission"
import LoginModal from "./components/LoginModal"
import Layout from "./components/Layout/Layout"
import Contact from "./components/Contact"

function App() {
  const [currentPage, setCurrentPage] = useState("home")
  const [user, setUser] = useState(null)
  const [userFilterData, setUserFilterData] = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  // Cookie utility functions
const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

 useEffect(() => {
  const verifyUserSession = async () => {
    try {
      // const storedSession = sessionStorage.getItem('userSession');
      const storedSession = getCookie('userSession');
      
      if (storedSession) {
        const userData = JSON.parse(storedSession);
        // console.log('🔄 Restoring active user session:', userData);

        setUser({
          type: userData.role,
          username: userData.username,
          pagination: userData.role === "admin" ? "all" : userData.pagination
        });
        setUserFilterData(userData.filterData);
        setCompanyData(userData.companyData);

        // ✅ FIX: refresh pe wahi page restore karo jo last time tha
        const storedCurrentPage = sessionStorage.getItem('currentPage');
        setCurrentPage(storedCurrentPage || "home");

        setIsLoading(false);
        return;
      }

      const sessionStartTime = sessionStorage.getItem('sessionStartTime');
      const currentTime = Date.now();
      
      if (!sessionStartTime) {
        // console.log('🆕 Fresh URL entry detected');
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          // console.log('🔍 Found previous login data - clearing for fresh start');
          sessionStorage.clear();
        }

        sessionStorage.setItem('sessionStartTime', currentTime.toString());
        sessionStorage.setItem('currentPage', 'home');

        setCurrentPage("home");
        setUser(null);
        setUserFilterData(null);
        setCompanyData(null);
      } else {
        // console.log('🔄 Page refresh within session - no active login found');
        setCurrentPage("home");
        setUser(null);
        setUserFilterData(null);
        setCompanyData(null);
      }
      
    } catch (error) {
      // console.error('❌ Error verifying session:', error);
      localStorage.removeItem('userData');
      sessionStorage.clear();
      setCurrentPage("home");
      setUser(null);
      setUserFilterData(null);
      setCompanyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  verifyUserSession();
}, []);
  
  // Update currentPage in sessionStorage whenever it changes (except during loading)
  useEffect(() => {
    if (!isLoading && currentPage) {
      sessionStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoading]);

  const handleViewAllProducts = () => {
    setCurrentPage("products")
  }

  const handleBackToHome = () => {
    setCurrentPage("home")
    setUser(null)
    setUserFilterData(null)
    setCompanyData(null)
    sessionStorage.removeItem('userSession')
    sessionStorage.setItem('currentPage', 'home')
  }

  const handleGoToContact = () => {
    setCurrentPage("contact")
  }

 const handleLogin = (role, username, pagination, filterData, companyInfo = null) => {
  // console.log('🎉 Login successful for:', username, 'Role:', role);
  // console.log('📊 Filter data received:', filterData);
  // console.log('🏢 Company data received:', companyInfo);
  
  // Handle pagination whether it's a string or object
  let paginationValue = pagination;
  
  if (typeof pagination === 'object') {
    try {
      paginationValue = JSON.parse(pagination);
    } catch (e) {
      console.warn("Could not parse pagination string, using as is:", pagination);
    }
  }
  
  // For admin role, set pagination to "all"
  const finalPagination = role === "admin" ? "all" : paginationValue;

  const userData = {
    type: role,
    username,
    pagination: finalPagination
  }

  setUser(userData)
  setUserFilterData(filterData)
  setCompanyData(companyInfo)
  setCurrentPage("dashboard")
  setIsLoginOpen(false)

  // Store comprehensive session data
  const sessionData = {
    role,
    username,
    pagination: finalPagination,
    filterData,
    companyData: companyInfo
  }
  
  // Store both session and persistent data
  sessionStorage.setItem('userSession', JSON.stringify(sessionData))
  sessionStorage.setItem('currentPage', 'dashboard')
  localStorage.setItem('userData', JSON.stringify(userData))

  console.log(userData,"suer dat formteflkjdfkjflkjdfkljfklj")
  
  // console.log('✅ Session data stored:', sessionData);
}

  // const handleLogout = () => {
  //   // console.log('👋 User logging out');
  //   setUser(null)
  //   setUserFilterData(null)
  //   setCompanyData(null)
  //   setCurrentPage("home")
    
  //   // Clear all stored data on logout
  //   sessionStorage.clear() // This will remove sessionStartTime too
  //   localStorage.removeItem("userData")
    
  //   // Set fresh session after logout
  //   sessionStorage.setItem('sessionStartTime', Date.now().toString());
  //   sessionStorage.setItem('currentPage', 'home');
  // }

  const handleLogout = () => {
  // console.log('👋 User logging out');
  setUser(null)
  setUserFilterData(null)
  setCompanyData(null)
  setCurrentPage("home")
  
  // Clear cookies instead of sessionStorage
  deleteCookie('userSession')
  deleteCookie('currentPage')
  sessionStorage.clear()
  localStorage.removeItem("user")
  localStorage.removeItem("currentUser")
  localStorage.removeItem("userData")
  localStorage.removeItem("role")

  
  // Set fresh session after logout
  sessionStorage.setItem('sessionStartTime', Date.now().toString());
  sessionStorage.setItem('currentPage', 'home');
}

  const handleOpenLogin = () => {
    setIsLoginOpen(true)
  }

  const handleCloseLogin = () => {
    setIsLoginOpen(false)
  }

  const scrollToReadyToStart = () => {
    const element = document.getElementById("ready-to-start")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (currentPage === "dashboard" && user) {
    return (
      <Layout 
        user={user}
        userFilterData={userFilterData}
        companyData={companyData}
        onLogout={handleLogout}
      />
    )
  }

  if (currentPage === "products") {
    return (
      <div className="bg-black text-white overflow-hidden">
        <ProductsPage onBackToHome={handleBackToHome} />
        <WhatsAppChat />
      </div>
    )
  }

  if (currentPage === "contact") {
    return (
      <div className="bg-black text-white overflow-hidden">
        <Contact onBackToHome={handleBackToHome} />
        <WhatsAppChat />
      </div>
    )
  }

  return (
    <div className="bg-black text-white overflow-hidden">
      <div className="relative z-50">
        <Navbar 
          onLogin={handleOpenLogin} 
          onContactClick={handleGoToContact} 
          user={user}
          onLogout={handleLogout}
        />
      </div>

      <main>
        <section id="home" className="relative z-10">
          <Hero onGetFreeDemoClick={scrollToReadyToStart} />
        </section>

        <section className="relative z-10">
          <ProblemSolution onGetFreeDemoClick={scrollToReadyToStart} />
        </section>

        <div className="bg-black relative z-10 -mt-8 sm:-mt-1">
          <div className="pt-4 sm:pt-0">
            <Features />
          </div>

          <section id="about" className="mt-4 sm:mt-0">
            <About />
          </section>

          <section id="services" className="mt-4 sm:mt-0">
            <Services />
          </section>

          <div className="mt-4 sm:mt-0">
            <Testimonials />
          </div>

          <div className="mt-4 sm:mt-0">
            <Counter onTransformBusinessClick={scrollToReadyToStart} />
          </div>

          <section id="ready-to-start" className="mt-4 sm:mt-0">
            <ReadyToStart />
          </section>
          
          <div className="mt-4 sm:mt-0">
            <VisionMission onTransformBusinessClick={scrollToReadyToStart} />
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppChat />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={handleCloseLogin}
        onLogin={handleLogin}
      />
    </div>
  )
}

export default App