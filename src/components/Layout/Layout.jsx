import React, { useState } from 'react';
import { Menu, Users, LogOut, Search } from 'lucide-react';
import Sidebar from '../Dashboard/Sidebar';
import AdminDashboard from '../Dashboard/AdminDashboard';
import ChatAssistant from '../../components/Dashboard/ChatAssistant'; // Import the chat assistant

const Header = ({ children, user, onLogout }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
            <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left section */}
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                        {/* Mobile menu button */}
                        {children}

                        {/* Logo */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>

                        {/* Title and info */}
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                                Enhanced Dashboard
                            </h1>
                            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                                <span className="truncate">Welcome back, {user?.username || 'Admin'}</span>
                                <span className="hidden md:inline">•</span>
                                <span className="hidden md:inline">{currentTime.toLocaleDateString()}</span>
                                <span className="hidden lg:inline">•</span>
                                <span className="hidden lg:inline">{currentTime.toLocaleTimeString()}</span>
                                {/* User role indicator */}
                                {user?.type && (
                                    <>
                                        <span className="hidden sm:inline">•</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${user.type === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : user.type === 'company'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.type === 'admin' ? 'Admin' : user.type === 'company' ? 'Company' : 'User'}
                                        </span>
                                    </>
                                )}
                            </div>
                            {/* Mobile-only user info */}
                            <div className="sm:hidden flex items-center space-x-2 text-xs text-gray-600">
                                <span className="truncate">{user?.username || 'Admin'}</span>
                                {user?.type && (
                                    <>
                                        <span>•</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : user.type === 'company'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.type === 'admin' ? 'Admin' : user.type === 'company' ? 'Company' : 'User'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                        {/* Mobile search button */}
                        <button className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                            <Search className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Logout button */}
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-1 sm:space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent px-2 sm:px-4 py-2 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const Layout = ({ user, userFilterData, companyData, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem("activeTab") || "overview";
    });

    // Whenever activeTab changes, save it
    React.useEffect(() => {
        sessionStorage.setItem("activeTab", activeTab);
    }, [activeTab]);

    const closeMobileSidebar = () => {
        setSidebarOpen(false);
    };

    const isMobile = window.innerWidth < 1024;

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop & Mobile */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-72 transform bg-white border-r border-gray-200 shadow-sm transition duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onClose={closeMobileSidebar}
                    isMobile={isMobile}
                    user={user}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header with mobile menu button */}
                <Header user={user} onLogout={onLogout}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-400 lg:hidden hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-4"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" />
                    </button>
                </Header>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="container mx-auto">
                        <AdminDashboard
                            onLogout={onLogout}
                            username={user?.username}
                            pagination={user?.pagination}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            user={user}
                            userFilterData={userFilterData}
                            companyData={companyData}
                        />
                    </div>
                </main>

                {/* Fixed Footer */}
                <footer className="bg-white border-t border-gray-200 py-3 px-4 flex-shrink-0">
                    <div className="container mx-auto text-center text-sm text-gray-600">
                        Powered by{' '}
                        <a
                            href="https://www.botivate.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            Botivate
                        </a>
                    </div>
                </footer>
            </div>

            {/* Global Chat Assistant - Available on all pages */}
            <ChatAssistant />
        </div>
    );
};

export default Layout;