import { useEffect, useState } from "react";
import { FaCaretDown, FaHeart, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-wrapper")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/");
  };

  return (
    <div>
      {/* Single Top Bar - Modern Gradient Design */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white text-sm px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur-sm">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Homefy" className="h-10 w-auto rounded-lg shadow-md" />
          <span className="text-lg font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Homefy</span>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex gap-6 items-center text-sm font-medium">
          <Link to="/" className="hover:text-yellow-300 transition-colors duration-200 relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link to="/contactus" className="hover:text-yellow-300 transition-colors duration-200 relative group">
            Contact Us
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link to="/aboutus" className="hover:text-yellow-300 transition-colors duration-200 relative group">
            About Us
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-full"></span>
          </Link>
          {user?.role === "admin" && (
            <Link to="/adminDash" className="hover:text-yellow-300 transition-colors duration-200 relative group">
              Admin Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          )}
        </div>

        {/* Right: Login / Profile */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link
              to="/login"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:text-yellow-300 font-medium border border-white/30"
            >
              Login
            </Link>
          ) : (
            <div className="relative dropdown-wrapper">
              <button
                className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:text-yellow-300 font-medium border border-white/30"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.name || "Profile"} <FaCaretDown size={12} />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg text-gray-800 rounded-xl shadow-2xl z-[9999] border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to="/wishlist"
                    className="flex items-center px-5 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 text-sm transition-all duration-200 rounded-t-xl"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FaHeart className="mr-3 text-pink-500" size={16} />
                    Wishlist
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-5 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-sm transition-all duration-200 rounded-b-xl border-t border-gray-100"
                  >
                    <FaSignOutAlt className="mr-3 text-red-500" size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
