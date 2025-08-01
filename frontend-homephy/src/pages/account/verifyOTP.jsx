import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../../components/Navbar";

const VerifyOTP = () => {
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            toast.error("OTP is required.");
            return;
        }

        try {
            const response = await axios.post(
                "https://localhost:3000/api/auth/verify-otp",
                { otp },
                { headers: { "Content-Type": "application/json" } }
            );
            toast.success("Email verified successfully!");
            setTimeout(() => navigate("/login"), 100);
        } catch (error) {
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.errors?.map((err) => err.msg).join(", ") ||
                "OTP verification failed. Please try again.";
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white shadow-md border border-gray-200 rounded-xl p-8">
                    <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                        Verify Your Email
                    </h2>
                    <p className="text-sm text-center text-gray-600 mb-6">
                        Please enter the 6-digit OTP sent to your email address.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                                OTP
                            </label>
                            <input
                                type="text"
                                id="otp"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Verify OTP
                        </button>
                    </form>

                    <div className="mt-6 text-sm text-center text-gray-600 space-y-2">
                        <p>
                            Didn’t receive the OTP?{" "}
                            <a href="/register" className="text-blue-500 hover:underline">
                                Resend
                            </a>
                        </p>
                        <p>
                            Already verified?{" "}
                            <a href="/login" className="text-blue-500 hover:underline">
                                Login
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VerifyOTP;
