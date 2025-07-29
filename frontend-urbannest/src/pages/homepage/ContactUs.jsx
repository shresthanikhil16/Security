import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const ContactUs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
    rentalType: "",
    area: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // For success/error messages
  const [loading, setLoading] = useState(false);
  const { secureAxios, isLoading: csrfLoading, csrfEnabled } = useCSRFProtection();

  // Check if user is logged in
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (csrfLoading) {
      toast.error("Security initialization in progress. Please wait.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      let response;

      if (secureAxios && typeof secureAxios.post === 'function') {
        // Use secure axios if available
        response = await secureAxios.post("/api/contact", formData);
      } else {
        // Fallback to regular axios
        console.warn("secureAxios not available, using fallback for contact form");
        response = await axios.post("https://localhost:3000/api/contact", formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      setStatus("Message sent successfully!");
      toast.success("Message sent successfully!");
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        location: "",
        rentalType: "",
        area: "",
        message: "",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.msg || "Failed to send message. Please try again.";
      setStatus(`Error: ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar user={user} /> {/* Passing user to Navbar */}
      <section className="max-w-6xl mx-auto px-6 py-16 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Side - Message Box */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Post a question or comment to see, read, and reply to
            </h2>
            <div className="mt-4 flex items-center">
              <img
                src="../../src/assets/icons/urbannest.png"
                alt="User"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="text-gray-800 font-semibold">Admin UrbanNest</p>
                <p className="text-gray-600 text-sm">Posted on Jan 20, 2025</p>
              </div>
            </div>
            <p className="mt-4 text-gray-700">
              Do you have a query?  Ask us anything at any moment!  Our staff is available to assist you whether you are trying to find a rental property or need assistance listing your house.
            </p>
            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="mt-4 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg"
              >
                Login to Post a Question
              </button>
            )}
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Didn't Find What You Are Looking For?
              <span className="text-orange-500"> Let us know</span>
            </h2>

            {status && (
              <p
                className={`mt-2 ${status.includes("success") ? "text-green-600" : "text-red-600"
                  }`}
              >
                {status}
              </p>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-700">Your Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Type your name..."
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700">
                  Your Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Type your phone number..."
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Your Email"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-gray-700">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Select or search your location"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700">Rental Type *</label>
                <input
                  type="text"
                  name="rentalType"
                  value={formData.rentalType}
                  onChange={handleChange}
                  placeholder="Select or type"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700">Tole/Area *</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g., Samakhushi"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700">If Any</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write a message"
                  className="w-full p-2 border rounded-md"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || csrfLoading}
                className="w-full px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {csrfLoading ? "Initializing Security..." : loading ? "Sending..." : "Send →"}
              </button>

              {!csrfLoading && csrfEnabled === false && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-600 text-center">
                    ⚠️ Running without CSRF protection
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default ContactUs;
