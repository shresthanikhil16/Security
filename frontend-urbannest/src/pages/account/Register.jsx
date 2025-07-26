import axios from "axios";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import zxcvbn from "zxcvbn";
import Navbar from "../../components/Navbar";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "email") setEmail(value);
    if (name === "password") {
      setPassword(value);
      setPasswordStrength(zxcvbn(value));
    }
    if (name === "confirmPassword") setConfirmPassword(value);
    if (name === "role") setRole(value);
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0:
      case 1:
        return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
      case 2:
        return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" };
      case 3:
        return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
      case 4:
        return { label: "Strong", color: "bg-green-500", width: "w-full" };
      default:
        return { label: "", color: "", width: "" };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !role) {
      toast.error("All fields are required.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,50}$/;
    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must include uppercase, lowercase, number and special character (8–50 chars)."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!recaptchaToken) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    const requestBody = {
      name,
      email,
      password,
      confirm_password: confirmPassword,
      role,
      recaptchaToken,
    };

    try {
      const response = await axios.post("https://localhost:3000/api/auth/register", requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      // Save to localStorage for OTP step
      localStorage.setItem("otpEmail", email);
      localStorage.setItem("otpUserId", response.data?.userId);

      toast.success("Registered successfully. Please verify OTP.");
      navigate("/verify-otp");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.map((err) => err.msg).join(", ") ||
        "Registration failed. Please try again.";
      toast.error(errorMsg);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border rounded-md bg-gray-50 text-sm focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border rounded-md bg-gray-50 text-sm focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border rounded-md bg-gray-50 text-sm focus:ring-blue-500"
              />
              {passwordStrength && (
                <div className="mt-2">
                  <p className={`text-sm ${getStrengthLabel(passwordStrength.score).color}`}>
                    Password Strength: {getStrengthLabel(passwordStrength.score).label}
                  </p>
                  <div className="h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className={`h-full rounded-full ${getStrengthLabel(passwordStrength.score).color} ${getStrengthLabel(passwordStrength.score).width}`}
                    />
                  </div>
                  {passwordStrength.feedback.suggestions.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Suggestions: {passwordStrength.feedback.suggestions.join(", ")}
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                At least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border rounded-md bg-gray-50 text-sm focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-md bg-gray-50 text-sm focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LcZ9Y4rAAAAADxHoNS147YLUKUpnt7ipiRuBnTY"
                onChange={(token) => {
                  setRecaptchaToken(token);
                  setRecaptchaError(null);
                }}
                onErrored={() => {
                  setRecaptchaError("CAPTCHA failed to load.");
                  setRecaptchaToken(null);
                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                  setRecaptchaError("CAPTCHA expired. Please try again.");
                }}
              />
            </div>
            {recaptchaError && (
              <p className="text-red-500 text-sm text-center">{recaptchaError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
            >
              Register
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Register;
