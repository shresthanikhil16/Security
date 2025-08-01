import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import forgotBg from '../../assets/images/forgotbg.png';
import { useCSRFProtection } from '../../hooks/useCSRFProtection';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { search } = useLocation();
    const navigate = useNavigate();
    const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();
    const token = new URLSearchParams(search).get('token');

    // Password strength validation
    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const strength = Object.values(requirements).filter(Boolean).length;
        return { requirements, strength };
    };

    const getPasswordStrengthColor = (strength) => {
        if (strength < 2) return 'bg-red-500';
        if (strength < 4) return 'bg-yellow-500';
        if (strength < 5) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = (strength) => {
        if (strength < 2) return 'Very Weak';
        if (strength < 4) return 'Weak';
        if (strength < 5) return 'Good';
        return 'Strong';
    };

    const passwordValidation = validatePassword(newPassword);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setTimeout(() => navigate('/forgot-password'), 2000);
                return;
            }

            try {
                const response = await axios.get(
                    `https://localhost:3000/api/auth/verify-reset-token?token=${token}`,
                    {
                        timeout: 10000,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );

                setTokenValid(true);
            } catch (error) {
                console.error('Token verification error:', error);
                setTokenValid(false);

                const errorMsg = error.response?.status === 404
                    ? "Invalid or expired reset link"
                    : "Unable to verify reset link. Please try again.";

                setMessage(errorMsg);
                toast.error(errorMsg);

                setTimeout(() => navigate('/forgot-password'), 3000);
            }
        };

        verifyToken();
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword.trim() || !confirmPassword.trim()) {
            const errorMsg = 'Please fill in all fields';
            setMessage(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (newPassword !== confirmPassword) {
            const errorMsg = 'Passwords do not match';
            setMessage(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (passwordValidation.strength < 3) {
            const errorMsg = 'Password is too weak. Please choose a stronger password.';
            setMessage(errorMsg);
            toast.error(errorMsg);
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            let response;

            if (secureAxios && !csrfLoading && typeof secureAxios.post === 'function') {
                response = await secureAxios.post("/api/auth/reset-password", {
                    token,
                    newPassword
                });
            } else {
                response = await axios.post(
                    'https://localhost:3000/api/auth/reset-password',
                    { token, newPassword },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000,
                    }
                );
            }

            const successMsg = response.data.msg || 'Password reset successfully!';
            setMessage(successMsg);
            toast.success(successMsg);

            // Clear form
            setNewPassword('');
            setConfirmPassword('');

            // Redirect to login after success
            setTimeout(() => navigate('/login'), 3000);

        } catch (error) {
            console.error('Password reset error:', error);

            let errorMsg;
            if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorMsg = "Unable to connect to server. Please try again later.";
            } else if (error.response?.status === 400) {
                errorMsg = "Invalid or expired reset token. Please request a new reset link.";
            } else if (error.response?.status === 429) {
                errorMsg = "Too many reset attempts. Please wait before trying again.";
            } else {
                errorMsg = error.response?.data?.msg ||
                    error.response?.data?.message ||
                    'An error occurred while resetting password. Please try again.';
            }

            setMessage(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Loading state while verifying token
    if (tokenValid === null) {
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
                <div className="w-full max-w-md bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Reset Link</h2>
                    <p className="text-sm text-gray-600">Please wait while we validate your reset token...</p>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (tokenValid === false) {
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
                <div className="w-full max-w-md bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/20 text-center">
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Invalid Reset Link</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    This reset link is invalid or has expired. Reset links are valid for 1 hour only.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                    >
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    // Valid token - show reset form
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
            <div className="w-full max-w-md bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/20">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Create New Password</h2>
                    <p className="text-sm text-gray-600">
                        Enter a strong password for your Homefy account
                    </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">
                                <strong>Secure Token Verified</strong>
                                <br />Your reset link is valid and secure. Create your new password below.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="newPassword"
                                name="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading || csrfLoading}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Enter your new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Password Strength</span>
                                    <span className={`text-xs font-medium ${passwordValidation.strength < 2 ? 'text-red-600' :
                                            passwordValidation.strength < 4 ? 'text-yellow-600' :
                                                passwordValidation.strength < 5 ? 'text-blue-600' : 'text-green-600'
                                        }`}>
                                        {getPasswordStrengthText(passwordValidation.strength)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordValidation.strength)}`}
                                        style={{ width: `${(passwordValidation.strength / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                    <p>Password must contain:</p>
                                    <ul className="list-none space-y-1 mt-1">
                                        <li className={passwordValidation.requirements.minLength ? 'text-green-600' : 'text-red-600'}>
                                            {passwordValidation.requirements.minLength ? '✓' : '✗'} At least 8 characters
                                        </li>
                                        <li className={passwordValidation.requirements.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                                            {passwordValidation.requirements.hasUpperCase ? '✓' : '✗'} Uppercase letter
                                        </li>
                                        <li className={passwordValidation.requirements.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
                                            {passwordValidation.requirements.hasLowerCase ? '✓' : '✗'} Lowercase letter
                                        </li>
                                        <li className={passwordValidation.requirements.hasNumbers ? 'text-green-600' : 'text-red-600'}>
                                            {passwordValidation.requirements.hasNumbers ? '✓' : '✗'} Number
                                        </li>
                                        <li className={passwordValidation.requirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                                            {passwordValidation.requirements.hasSpecialChar ? '✓' : '✗'} Special character
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading || csrfLoading}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Confirm your new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showConfirmPassword ? (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password Match Indicator */}
                        {confirmPassword && (
                            <div className="mt-2">
                                {newPassword === confirmPassword ? (
                                    <p className="text-xs text-green-600 flex items-center">
                                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Passwords match
                                    </p>
                                ) : (
                                    <p className="text-xs text-red-600 flex items-center">
                                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || csrfLoading || !newPassword.trim() || !confirmPassword.trim() || newPassword !== confirmPassword || passwordValidation.strength < 3}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating Password...
                            </div>
                        ) : csrfLoading ? (
                            "Initializing Security..."
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes("success") || message.includes("reset")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                        {message}
                        {message.includes("success") && (
                            <div className="mt-2 text-xs text-green-600">
                                Redirecting to login page in 3 seconds...
                            </div>
                        )}
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

export default ResetPassword;
