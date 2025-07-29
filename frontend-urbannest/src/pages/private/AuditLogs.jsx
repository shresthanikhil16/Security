import axios from "axios";
import { useEffect, useState } from "react";
import { FaFileAlt, FaHome, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [filterAction, setFilterAction] = useState("");
    const [filterEmail, setFilterEmail] = useState("");
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

    // Fallback API instance for when CSRF is not available
    const fallbackApi = axios.create({
        baseURL: "https://localhost:3000",
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "admin") {
            toast.error("Admin access required");
            navigate("/login");
            return;
        }

        const fetchLogs = async () => {
            if (csrfLoading) {
                console.log("CSRF still loading, waiting...");
                return;
            }

            try {
                let response;
                
                // Try secure axios first, fallback to regular axios with auth headers
                if (secureAxios && typeof secureAxios.get === 'function') {
                    console.log("Using secure CSRF-protected request");
                    response = await secureAxios.get("/api/audit/audit-logs", {
                        params: { page, limit, action: filterAction, email: filterEmail },
                    });
                } else {
                    console.log("Using fallback API with Bearer token");
                    response = await fallbackApi.get("/api/audit/audit-logs", {
                        params: { page, limit, action: filterAction, email: filterEmail },
                    });
                }
                
                setLogs(response.data.logs || []);
                setTotal(response.data.total || 0);
            } catch (error) {
                console.error("Audit logs fetch error:", error);
                if (error.response?.status === 403) {
                    toast.error("Admin access required");
                    navigate("/login");
                } else if (error.response?.status === 401) {
                    toast.error("Authentication required. Please login again.");
                    navigate("/login");
                } else {
                    toast.error(error.response?.data?.message || "Failed to fetch audit logs");
                }
            }
        };

        fetchLogs();
    }, [navigate, page, filterAction, filterEmail, secureAxios, csrfLoading]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === "action") setFilterAction(value);
        if (name === "email") setFilterEmail(value);
        setPage(1);
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
                                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                                >
                                    <FaHome className="mr-2" /> Manage Flats
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate("/audit-logs")}
                                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center bg-gray-700"
                                >
                                    <FaFileAlt className="mr-2" /> Audit Logs
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate("/profile")}
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
                                try {
                                    await api.post("/api/auth/logout");
                                    localStorage.removeItem("user");
                                    toast.success("Logged out successfully");
                                    navigate("/login");
                                } catch (error) {
                                    toast.error(error.response?.data?.message || "Error logging out");
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
                            <h3 className="text-2xl font-semibold flex items-center">
                                <FaFileAlt className="mr-2" /> Audit Logs
                            </h3>
                        </div>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <input
                                type="text"
                                name="action"
                                value={filterAction}
                                onChange={handleFilterChange}
                                placeholder="Filter by action (e.g., User Login)"
                                className="px-4 py-2 border rounded-md w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                name="email"
                                value={filterEmail}
                                onChange={handleFilterChange}
                                placeholder="Filter by user email"
                                className="px-4 py-2 border rounded-md w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 text-left text-sm font-medium text-gray-700">
                                        <th className="px-4 py-3 border w-40">Timestamp</th>
                                        <th className="px-4 py-3 border w-32">Action</th>
                                        <th className="px-4 py-3 border w-40">User Email</th>
                                        <th className="px-4 py-3 border w-64">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log._id} className="bg-white hover:bg-gray-50">
                                                <td className="px-4 py-3 border">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3 border">{log.action}</td>
                                                <td className="px-4 py-3 border" title={log.userEmail}>
                                                    {log.userEmail.length > 30 ? `${log.userEmail.substring(0, 30)}...` : log.userEmail}
                                                </td>
                                                <td className="px-4 py-3 border" title={log.details}>
                                                    {log.details.length > 50 ? `${log.details.substring(0, 50)}...` : log.details}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center px-4 py-3 text-gray-500">
                                                No audit logs available
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
        </div>
    );
};

export default AuditLogs;