import { useEffect, useState } from "react";
import { FaCaretDown, FaHeart, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/icons/urbannest.png";

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
      {/* Single Top Bar - No Scroll Animation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1A525E] text-white text-sm px-6 py-3 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Urban Nest" className="h-10 w-auto rounded-lg" />
          <span className="text-lg font-semibold">Urban Nest</span>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex gap-6 items-center text-sm font-medium">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/contactus" className="hover:underline">Contact Us</Link>
          <Link to="/aboutus" className="hover:underline">About Us</Link>
          {user?.role === "admin" && (
            <Link to="/adminDash" className="hover:underline">Admin Dashboard</Link>
          )}
        </div>

        {/* Right: Login / Profile */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link
              to="/login"
              className="hover:underline hover:text-gray-200 transition-colors"
            >
              Login
            </Link>
          ) : (
            <div className="relative dropdown-wrapper">
              <button
                className="flex items-center gap-1 hover:text-gray-200"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.name || "Profile"} <FaCaretDown size={12} />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl z-[9999]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to="/wishlist"
                    className="flex items-center px-5 py-3 hover:bg-gray-100 text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FaHeart className="mr-3 text-pink-500" size={16} />
                    Wishlist
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-5 py-3 hover:bg-gray-100 text-sm"
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
