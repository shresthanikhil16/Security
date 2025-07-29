import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import forgotBg from '../../assets/images/forgotbg.png';
import { useCSRFProtection } from '../../hooks/useCSRFProtection';

const ForgotPasswordOTP = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1 for OTP verification, 2 for password reset
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

    useEffect(() => {
        // Get email from localStorage (set when forgot password was submitted)
        const savedEmail = localStorage.getItem('forgotPasswordEmail');
        if (!savedEmail) {
            toast.error('Session expired. Please try again.');
            navigate('/forgot-password');
            return;
        }
        setEmail(savedEmail);
    }, [navigate]);

    const handleOTPVerification = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            toast.error('OTP is required.');
            return;
        }

        if (csrfLoading || !secureAxios) {
            toast.error("Security initialization in progress. Please wait.");
            return;
        }

        setLoading(true);
        try {
            const response = await secureAxios.post(
                '/api/auth/verify-forgot-password-otp',
                { email, otp }
            );

            toast.success('OTP verified successfully!');
            setStep(2); // Move to password reset step
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const errorMsg = error.response?.data?.message || error.response?.data?.msg || 'Invalid or expired OTP';
            toast.error(errorMsg);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();

        if (!newPassword.trim() || !confirmPassword.trim()) {
            toast.error('Both password fields are required.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        if (csrfLoading || !secureAxios) {
            toast.error("Security initialization in progress. Please wait.");
            return;
        }

        setLoading(true);
        try {
            const response = await secureAxios.post(
                '/api/auth/reset-password-with-otp',
                { email, otp, newPassword }
            );

            toast.success('Password reset successfully!');
            localStorage.removeItem('forgotPasswordEmail'); // Clean up
            setTimeout(() => navigate('/login'), 2000);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const errorMsg = error.response?.data?.message || error.response?.data?.msg || 'An error occurred';
            toast.error(errorMsg);
        }
    };

    const handleResendOTP = async () => {
        if (csrfLoading || !secureAxios) {
            toast.error("Security initialization in progress. Please wait.");
            return;
        }

        setLoading(true);
        try {
            await secureAxios.post(
                '/api/auth/forgotpassword',
                { email }
            );
            toast.success('New OTP sent to your email!');
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error('Failed to resend OTP. Please try again.');
        }
    };

    return (
        <div
            className="flex justify-center items-center min-h-screen bg-cover bg-center"
            style={{
                backgroundImage: `url(${forgotBg})`,
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center',
            }}
        >
            <div className="w-full max-w-md bg-white/90 backdrop-blur-lg p-8 rounded-lg shadow-md">
                {step === 1 ? (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                            Verify OTP
                        </h2>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Enter the OTP sent to {email}
                        </p>
                        <form onSubmit={handleOTPVerification} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                    OTP Code
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength="6"
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter 6-digit OTP"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || csrfLoading || !secureAxios}
                                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {csrfLoading ? 'Initializing Security...' : loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleResendOTP}
                                disabled={loading || csrfLoading || !secureAxios}
                                className="text-blue-600 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Didn't receive OTP? Resend
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                            Reset Password
                        </h2>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Enter your new password
                        </p>
                        <form onSubmit={handlePasswordReset} className="space-y-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength="6"
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength="6"
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || csrfLoading || !secureAxios}
                                className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {csrfLoading ? 'Initializing Security...' : loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-600 hover:underline text-sm"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordOTP;
