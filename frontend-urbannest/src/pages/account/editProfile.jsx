// EditProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const EditProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (csrfLoading || !secureAxios) {
                return; // Wait for CSRF to initialize
            }

            try {
                const response = await secureAxios.get(`/api/edit/customer/${id}`);

                if (response.data && response.data.user) {
                    setUser(response.data.user); // Assuming the response contains user data
                } else {
                    console.error("User data not found in response");
                    toast.error("User data not found");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Error fetching profile");
            }
        };

        fetchUserProfile();
    }, [id, secureAxios, csrfLoading]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({ ...prevUser, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (csrfLoading || !secureAxios) {
            toast.error("Security initialization in progress. Please wait.");
            return;
        }

        try {
            const response = await secureAxios.put(`/api/edit/update/${id}`, user);

            if (response.status === 200) {
                toast.success('Profile updated successfully');
                navigate("/profile");
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Error updating profile');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Validate password fields
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("All password fields are required");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return;
        }

        if (csrfLoading || !secureAxios) {
            toast.error("Security initialization in progress. Please wait.");
            return;
        }

        try {
            const response = await secureAxios.put(
                `/api/auth/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }
            );

            if (response.status === 200) {
                toast.success('Password changed successfully');
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setShowPasswordSection(false);
            } else {
                toast.error('Failed to change password');
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error(error.response?.data?.message || 'Error changing password');
        }
    };

    if (!user || csrfLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg text-gray-600">
                        {csrfLoading ? "Initializing security..." : "Loading..."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Edit Profile</h2>

                {/* Profile Information Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={user.name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Update Profile
                    </button>
                </form>

                {/* Change Password Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {showPasswordSection ? 'Hide' : 'Change Password'}
                    </button>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Password:</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password:</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Change Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordSection(false);
                                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Back to Profile Button */}
                <div className="mt-6">
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;