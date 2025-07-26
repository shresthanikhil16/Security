import {
  FaEnvelope,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPhoneSquareAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import "tailwindcss/tailwind.css";
import parts from "../assets/icons/logo2.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-6 mt-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Section: Contact Info */}
          <div className="flex flex-col justify-start items-start space-y-4">
            <div className="flex items-center space-x-2">
              <FaMapMarkerAlt className="w-5 h-5" />
              <p className="text-sm font-bold">Pokhara, Nepal 77777</p>
            </div>
            <div className="flex items-center space-x-2">
              <FaEnvelope className="w-5 h-5" />
              <p className="text-sm font-bold">urbanNest@gmail.com</p>
            </div>
            <div className="flex items-center space-x-2">
              <FaPhoneAlt className="w-5 h-5" />
              <p className="text-sm font-bold">+977-9867055337</p>
            </div>
            <div className="flex items-center space-x-2">
              <FaUser className="w-5 h-5" />
              <p className="text-sm font-bold">Pratham Shrestha</p>
            </div>
          </div>

          {/* Center Section: Logo */}
          <div className="flex justify-center items-start">
            <a href="/">
              <img src={parts} alt="UrbanNest Logo" className="w-32" />
            </a>
          </div>

          {/* Right Section: Quick Links */}
          <div className="flex justify-end items-start">
            <ul className="list-none text-sm space-y-3">
              <li className="flex items-center space-x-2">
                <FaShieldAlt className="w-5 h-5" />
                <a
                  href="/privacypolicy"
                  className="text-white hover:text-gray-400 font-bold"
                >
                  Privacy Policy
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <FaFileAlt className="w-5 h-5" />
                <a
                  href="/termscondition"
                  className="text-white hover:text-gray-400 font-bold"
                >
                  Terms of Use
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <FaQuestionCircle className="w-5 h-5" />
                <a
                  href="/faq"
                  className="text-white hover:text-gray-400 font-bold"
                >
                  FAQ
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <FaPhoneSquareAlt className="w-5 h-5" />
                <a
                  href="/contactus"
                  className="text-white hover:text-gray-400 font-bold"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center mt-6 text-xs text-gray-400 font-bold">
          &copy; 2025 UrbanNest — Pratham Shrestha. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
