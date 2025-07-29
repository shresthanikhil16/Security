import axios from "axios";
import { useEffect, useState } from "react";
import { FaFileAlt, FaHome, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const AdminDashboard = () => {
  const [flats, setFlats] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

  const getToken = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.token || null;
    } catch {
      return null;
    }
  };

  const api = axios.create({
    baseURL: "https://localhost:3000",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // Helper function to get the appropriate axios instance
  const getApiInstance = () => {
    if (secureAxios && typeof secureAxios.get === 'function') {
      return secureAxios;
    }
    return api;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      toast.error("Admin access required");
      navigate("/login");
      return;
    }

    const fetchFlats = async () => {
      if (csrfLoading) {
        console.log("CSRF still loading, waiting...");
        return;
      }

      try {
        const apiInstance = getApiInstance();
        const response = await apiInstance.get(`/api/rooms?page=${page}&limit=${limit}`);
        setFlats(response.data.rooms || []);
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error("Fetch flats error:", error);
        if (error.response?.status === 403) {
          toast.error("Admin access required");
          navigate("/login");
        } else if (error.response?.status === 401) {
          toast.error("Authentication required. Please login again.");
          navigate("/login");
        } else {
          toast.error(error.response?.data?.message || "Failed to fetch rooms");
        }
      }
    };

    fetchFlats();
  }, [navigate, page, secureAxios, csrfLoading]);

  const handleEdit = (flatId) => {
    navigate(`/adminUpdate/${flatId}`);
  };

  const handleDelete = async (flatId) => {
    if (csrfLoading) {
      toast.error("Security initialization in progress. Please wait.");
      return;
    }

    try {
      const apiInstance = getApiInstance();
      await apiInstance.delete(`/api/rooms/${flatId}`);
      setFlats(flats.filter((flat) => flat._id !== flatId));
      toast.success("Room deleted successfully");
    } catch (error) {
      console.error("Delete room error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete room");
      }
    }
  };

  const goToAddProducts = () => {
    navigate("/addRooms");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const totalPages = Math.ceil(total / limit);

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
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center bg-gray-700"
                >
                  <FaHome className="mr-2" /> Manage Flats
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/audit-logs")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <FaFileAlt className="mr-2" /> Audit Logs
                </button>
              </li>
              <li>
                <button
                  onClick={goToProfile}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <FaUser className="mr-2" /> Customer Details
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
              onClick={async () => {
                if (csrfLoading) {
                  toast.error("Security initialization in progress. Please wait.");
                  return;
                }

                try {
                  const apiInstance = getApiInstance();
                  await apiInstance.post("/api/auth/logout");
                  localStorage.removeItem("user");
                  toast.success("Logged out successfully");
                  navigate("/login");
                } catch (error) {
                  console.error("Logout error:", error);
                  // Even if logout fails, clear local storage and redirect
                  localStorage.removeItem("user");
                  toast.error(error.response?.data?.message || "Error logging out");
                  navigate("/login");
                }
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">Manage Flats</h3>
              <button
                onClick={goToAddProducts}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-md"
              >
                Add Room
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-left text-sm font-medium text-gray-700">
                    <th className="px-4 py-3 border w-24">Room Image</th>
                    <th className="px-4 py-3 border w-40">Room Description</th>
                    <th className="px-4 py-3 border w-16">Floor</th>
                    <th className="px-4 py-3 border w-40">Address</th>
                    <th className="px-4 py-3 border w-24">Rent Price</th>
                    <th className="px-4 py-3 border w-24">Parking</th>
                    <th className="px-4 py-3 border w-24">Contact No</th>
                    <th className="px-4 py-3 border w-20">Bathroom</th>
                    <th className="px-4 py-3 border w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flats.length > 0 ? (
                    flats.map((flat) => (
                      <tr key={flat._id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 border">
                          {flat.roomImage && (
                            <img
                              src={`https://localhost:3000/${flat.roomImage}`}
                              alt="Room"
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 border" title={flat.roomDescription}>
                          {flat.roomDescription.length > 30
                            ? `${flat.roomDescription.substring(0, 30)}...`
                            : flat.roomDescription}
                        </td>
                        <td className="px-4 py-3 border">{flat.floor}</td>
                        <td className="px-4 py-3 border" title={flat.address}>
                          {flat.address.length > 30 ? `${flat.address.substring(0, 30)}...` : flat.address}
                        </td>
                        <td className="px-4 py-3 border">₹{flat.rentPrice}</td>
                        <td className="px-4 py-3 border">{flat.parking}</td>
                        <td className="px-4 py-3 border">{flat.contactNo}</td>
                        <td className="px-4 py-3 border">{flat.bathroom}</td>
                        <td className="px-4 py-3 border">
                          <div className="flex space-x-2">
                            <Link to={`/adminUpdate/${flat._id}`}>
                              <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                                Edit
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(flat._id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center px-4 py-3 text-gray-500">
                        No flats available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-300 rounded-md mr-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-300 rounded-md ml-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;