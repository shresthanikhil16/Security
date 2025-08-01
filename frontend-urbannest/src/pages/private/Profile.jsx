import moment from "moment";
import { useEffect, useState } from "react";
import { FaEdit, FaHome, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const Profile = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (secureAxios && !csrfLoading && typeof secureAxios.get === 'function') {
          response = await secureAxios.get("/api/user/customer");
        } else {
          // Fallback to regular fetch with token and CSRF
          const token = JSON.parse(localStorage.getItem("user"))?.token;

          // Try to get CSRF token for fallback
          let csrfToken = null;
          try {
            const csrfResponse = await fetch('https://localhost:3000/api/auth/csrf-token', {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });

            if (csrfResponse.ok) {
              const csrfData = await csrfResponse.json();
              csrfToken = csrfData.csrfToken;
            }
          } catch (csrfError) {
            console.warn("CSRF token fetch error for user list:", csrfError.message);
          }

          const headers = {
            Authorization: `Bearer ${token}`,
          };

          if (csrfToken) {
            headers['x-csrf-token'] = csrfToken;
            headers['X-CSRF-Token'] = csrfToken;
          }

          const res = await fetch("https://localhost:3000/api/user/customer", {
            headers: headers,
            credentials: 'include',
          });
          const data = await res.json();
          response = { data };
        }

        console.log("Fetched users:", response.data);
        setUsers(response.data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [secureAxios, csrfLoading]);

  const handleDelete = async (userId) => {
    console.log("🔄 Starting user deletion process for ID:", userId);
    console.log("🔐 CSRF Loading status:", csrfLoading);
    console.log("🔒 Secure Axios available:", !!secureAxios);
    console.log("🔑 Secure Axios type:", typeof secureAxios);
    console.log("🔑 Secure Axios methods:", secureAxios ? Object.keys(secureAxios) : "None");
    console.log("🔑 Secure Axios delete function:", typeof secureAxios?.delete);

    if (!userId) {
      alert("Invalid user ID");
      return;
    }

    if (csrfLoading) {
      alert("Security initialization in progress. Please wait.");
      return;
    }

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      let response;

      // Check if secureAxios has the delete method
      if (secureAxios && typeof secureAxios.delete === 'function') {
        console.log("✅ Using secure axios with CSRF protection");
        try {
          // Use secure axios with CSRF protection
          response = await secureAxios.delete(`/api/user/delete/${userId}`);
          console.log("📋 Secure axios response:", response);

          if (response.data && response.data.success) {
            setUsers(users.filter((user) => user._id !== userId));
            alert("User deleted successfully");
            return; // Exit early on success
          } else {
            console.error("❌ Delete failed - response:", response.data);
            alert(response.data?.message || "Failed to delete user");
            return; // Exit early on failure
          }
        } catch (secureAxiosError) {
          console.error("❌ Secure axios failed:", secureAxiosError);
          // If it's a 403 CSRF error, try to refresh token and retry
          if (secureAxiosError.response?.status === 403 &&
            secureAxiosError.response?.data?.message?.includes('CSRF')) {
            console.log("🔄 Attempting to refresh CSRF token and retry...");

            // Force a page reload to reinitialize CSRF
            if (confirm("Security token expired. Reload page to refresh security and try again?")) {
              window.location.reload();
              return;
            }
          }
          throw secureAxiosError; // Re-throw to fall through to fallback
        }
      } else {
        console.log("⚠️  secureAxios doesn't have delete method, using manual secure request");

        // Manual secure delete with proper CSRF token
        try {
          // Get fresh CSRF token with proper session handling
          console.log("🔑 Getting fresh CSRF token...");

          // First, ensure we have a proper session by making a simple authenticated request
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          if (!user.token) {
            throw new Error('No authentication token found');
          }

          // Make an initial request to establish session
          const sessionResponse = await fetch('https://localhost:3000/api/auth/csrf-token', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (!sessionResponse.ok) {
            throw new Error(`CSRF token fetch failed: ${sessionResponse.status}`);
          }

          const csrfData = await sessionResponse.json();
          console.log("🔑 CSRF token response:", csrfData);

          if (!csrfData.success || !csrfData.csrfToken) {
            throw new Error('Invalid CSRF token response');
          }

          // Wait a moment to ensure session is established
          await new Promise(resolve => setTimeout(resolve, 100));

          // Make secure delete request with the same session
          const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
            "X-CSRF-Token": csrfData.csrfToken,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          };

          console.log("🔐 Making delete request with headers:", Object.keys(headers));
          console.log("🔐 CSRF token being sent:", csrfData.csrfToken);

          const deleteResponse = await fetch(`https://localhost:3000/api/user/delete/${userId}`, {
            method: "DELETE",
            headers: headers,
            credentials: 'include',
          });

          console.log("📋 Delete response status:", deleteResponse.status);
          console.log("📋 Delete response ok:", deleteResponse.ok);

          if (deleteResponse.ok) {
            const responseData = await deleteResponse.json();
            console.log("✅ Delete successful:", responseData);

            if (responseData.success) {
              setUsers(users.filter((user) => user._id !== userId));
              alert("User deleted successfully");
              return;
            } else {
              alert(responseData.message || "Delete operation failed");
              return;
            }
          } else {
            const errorData = await deleteResponse.json();
            console.error("❌ Delete failed - error data:", errorData);

            // If it's still a CSRF error, try with different header format
            if (errorData.message?.includes('CSRF')) {
              console.log("🔄 Trying with alternative CSRF header format...");

              // Try with lowercase header only
              const alternativeHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`,
                "x-csrf-token": csrfData.csrfToken,
                "Accept": "application/json"
              };

              const retryResponse = await fetch(`https://localhost:3000/api/user/delete/${userId}`, {
                method: "DELETE",
                headers: alternativeHeaders,
                credentials: 'include',
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.success) {
                  setUsers(users.filter((user) => user._id !== userId));
                  alert("User deleted successfully");
                  return;
                }
              }
            }

            alert(errorData.message || `Delete failed with status ${deleteResponse.status}`);
            return;
          }

        } catch (manualError) {
          console.error("❌ Manual secure request failed:", manualError);
          throw manualError;
        }
      }

    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col justify-between fixed h-full">
          <div>
            <h2 className="text-2xl font-semibold mb-8 text-center">Admin Dashboard</h2>
            <ul className="space-y-4 mt-4">
              <li>
                <button
                  onClick={() => navigate("/adminDash")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <FaHome className="mr-2" /> Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/addRooms")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <FaPlus className="mr-2" /> Add Rooms
                </button>
              </li>
            </ul>
          </div>
          <div className="flex justify-between mt-auto space-x-2">
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-bold"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 pt-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto bg-white border-4 border-gray-300 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">User Profiles</h2>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CSRF Loading Warning */}
            {csrfLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Security Initialization</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Security features are being initialized. Some actions may be temporarily unavailable.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-left text-sm font-medium text-gray-700">
                      <th className="px-4 py-3 border w-32">Name</th>
                      <th className="px-4 py-3 border w-40">Email</th>
                      <th className="px-4 py-3 border w-24">Role</th>
                      <th className="px-4 py-3 border w-40">Created At</th>
                      <th className="px-4 py-3 border w-40">Updated At</th>
                      <th className="px-4 py-3 border w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user._id} className="bg-white hover:bg-gray-50">
                          <td className="px-4 py-3 border font-medium truncate">{user.name}</td>
                          <td className="px-4 py-3 border font-medium truncate">{user.email}</td>
                          <td className="px-4 py-3 border font-medium">{user.role}</td>
                          <td className="px-4 py-3 border font-medium">
                            {moment(user.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3 border font-medium">
                            {moment(user.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3 border">
                            <div className="flex space-x-2">
                              <Link
                                to={`/edit-user/${user._id}`}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <FaEdit />
                              </Link>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center px-4 py-3 text-gray-500">
                          No users available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;