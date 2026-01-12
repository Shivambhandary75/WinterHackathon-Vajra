import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Check login status and user data
  useEffect(() => {
    const type = localStorage.getItem("userType");
    if (type) {
      setIsLoggedIn(true);
      setUserType(type);

      // Get user/institution name and email from localStorage
      if (type === "institution") {
        setUserName(localStorage.getItem("institutionName") || "Institution");
        setUserEmail(localStorage.getItem("institutionEmail") || "");
      } else {
        setUserName(localStorage.getItem("userName") || "User");
        setUserEmail(localStorage.getItem("userEmail") || "");
      }
    }
  }, [location.pathname]); // Re-check when route changes

  // Check if we're on the dashboard page
  const isDashboardPage = location.pathname === "/dashboard";

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("institutionId");
    localStorage.removeItem("institutionEmail");
    localStorage.removeItem("institutionName");

    // Update state
    setIsLoggedIn(false);
    setUserType(null);
    setUserName("");
    setUserEmail("");

    // Redirect to home
    navigate("/");
  };

  return (
    <nav className="bg-[#28363D] shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#658B6F] rounded-lg"></div>
            <span className="text-white text-xl font-bold">SafetyNet</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-[#CEE1DD] hover:text-white transition-colors "
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-[#CEE1DD] hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Always show profile on dashboard, otherwise show based on login status */}
            {isDashboardPage || isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 bg-[#658B6F] hover:bg-[#6D9197] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-[#CEE1DD] rounded-full flex items-center justify-center text-[#28363D] font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium">{userName}</p>
                    {userEmail && (
                      <p className="text-xs opacity-75 truncate max-w-[150px]">
                        {userEmail}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-[#CEE1DD]">
                      <p className="text-sm font-semibold text-[#28363D]">
                        {userName}
                      </p>
                      <p className="text-xs text-[#6D9197] truncate">
                        {userEmail}
                      </p>
                      <p className="text-xs text-[#99AEAD] mt-1">
                        {userType === "institution"
                          ? "Institution Account"
                          : "User Account"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(
                          userType === "institution"
                            ? "/institution/profile/edit"
                            : "/profile/edit"
                        );
                      }}
                      className="w-full text-left px-4 py-2 text-[#28363D] hover:bg-[#CEE1DD] transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </button>
                    <div className="border-t border-[#CEE1DD] my-1"></div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="text-[#CEE1DD] hover:text-white transition-colors px-4 py-2">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="bg-[#658B6F] hover:bg-[#6D9197] text-white px-6 py-2 rounded-lg transition-colors">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
