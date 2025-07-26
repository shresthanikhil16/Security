import axios from "axios";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../../components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    if (!recaptchaToken) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    if (recaptchaError) {
      toast.error("reCAPTCHA loading failed. Please try again.");
      return;
    }

    const requestBody = { email, password, recaptchaToken };
    console.log("Login request body:", requestBody);

    try {
      const response = await axios.post(
        "https://localhost:3000/api/auth/login",
        requestBody,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Login response:", response.data);

      const { token, role, name, _id } = response.data;
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify({ token, role, name, userId: _id }));
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.map((err) => err.msg).join(", ") ||
        "Login failed. Please try again.";
      console.error("Login error:", error.response?.data);
      toast.error(errorMsg, { autoClose: 5000 });
      recaptchaRef.current.reset();
      setRecaptchaToken(null);
    }
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setRecaptchaError(null);
    console.log("reCAPTCHA token generated:", token);
  };

  const handleRecaptchaError = () => {
    setRecaptchaError("Failed to load reCAPTCHA. Please check your network or try again.");
    setRecaptchaToken(null);
    console.error("reCAPTCHA error: Failed to load");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h3>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LcZ9Y4rAAAAADxHoNS147YLUKUpnt7ipiRuBnTY"
                onChange={handleRecaptchaChange}
                onErrored={handleRecaptchaError}
                onExpired={() => {
                  setRecaptchaToken(null);
                  setRecaptchaError("reCAPTCHA session expired. Please try again.");
                  console.log("reCAPTCHA expired");
                }}
              />
            </div>
            {recaptchaError && (
              <p className="text-red-500 text-sm text-center">{recaptchaError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
            <p>
              Don’t have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Register
              </a>
            </p>
            <p>
              Forgot your password?{" "}
              <a href="/forgot-password" className="text-blue-600 hover:underline">
                Reset Password
              </a>
            </p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;