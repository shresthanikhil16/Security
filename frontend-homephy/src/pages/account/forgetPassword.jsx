import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import forgotBg from "../../assets/images/forgotbg.png";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      const errorMsg = "Please enter your email address";
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!validateEmail(email)) {
      const errorMsg = "Please enter a valid email address";
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let response;

      if (secureAxios && !csrfLoading && typeof secureAxios.post === 'function') {
        response = await secureAxios.post("/api/auth/forgotPassword", { email });
      } else {
        response = await axios.post(
          "https://localhost:3000/api/auth/forgotPassword",
          { email },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 second timeout for email delivery
          }
        );
      }

      const successMsg = response.data.msg || "Password reset link sent to your email!";
      setMessage(successMsg);
      setIsEmailSent(true);
      toast.success(successMsg);

      // Clear the form
      setEmail("");

    } catch (error) {
      console.error("Password reset error:", error);

      // Handle different error scenarios
      let errorMsg;
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMsg = "Unable to connect to server. Please try again later.";
      } else if (error.response?.status === 404) {
        errorMsg = "Email address not found in our system.";
      } else if (error.response?.status === 429) {
        errorMsg = "Too many reset attempts. Please wait before trying again.";
      } else {
        errorMsg = error.response?.data?.msg ||
          error.response?.data?.message ||
          "An error occurred while sending reset link. Please try again.";
      }

      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${forgotBg})`,
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-600">
            Secure password reset for your Homefy account
          </p>
        </div>

        {!isEmailSent ? (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Secure Reset Process:</strong>
                    <br />• Unique cryptographic token (expires in 1 hour)
                    <br />• SHA-256 hashed for maximum security
                    <br />• Single-use token sent to verified email
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || csrfLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your registered email address"
                />
              </div>

              <button
                type="submit"
                disabled={loading || csrfLoading || !email.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Secure Reset Link...
                  </div>
                ) : csrfLoading ? (
                  "Initializing Security..."
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Reset link sent successfully!</strong>
                    <br />Check your email and click the secure link to reset your password.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">What happens next?</h3>
              <ul className="text-xs text-gray-600 space-y-1 text-left">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the secure reset link (valid for 1 hour)</li>
                <li>• Enter your new password</li>
                <li>• Your account will be securely updated</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setIsEmailSent(false);
                setMessage("");
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Send another reset link
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes("sent") || message.includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
