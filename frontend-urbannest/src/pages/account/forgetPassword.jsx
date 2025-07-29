import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import forgotBg from "../../assets/images/forgotbg.png"; // Import the local image
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { secureAxios, isLoading: csrfLoading, csrfEnabled } = useCSRFProtection();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (csrfLoading || !secureAxios) {
      toast.error("Security initialization in progress. Please wait.");
      return;
    }

    setLoading(true);
    try {
      const response = await secureAxios.post(
        "/api/auth/forgotpassword",
        { email }
      );
      setMessage(response.data.msg);
      toast.success("OTP sent to your email!");

      // Store email for OTP verification
      localStorage.setItem("forgotPasswordEmail", email);

      // Redirect to OTP verification page
      setTimeout(() => navigate("/forgot-password-otp"), 1500);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || error.response?.data?.msg || "An error occurred";
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${forgotBg})`, // Use local image
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email address below to receive a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
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
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <button
            type="submit"
            disabled={loading || csrfLoading || !secureAxios}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {csrfLoading
              ? "Initializing Security..."
              : loading
                ? "Sending..."
                : "Send Reset Link"
            }
          </button>
        </form>

        {!csrfLoading && csrfEnabled === false && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-600 text-center">
              ⚠️ Running without CSRF protection
            </p>
          </div>
        )}

        {message && (
          <p className="mt-4 text-center text-green-500 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
