import { useEffect, useState } from "react";
import { FaHome, FaPlus, FaSave, FaTimes, FaUser } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`https://localhost:3000/api/user/${id}`, {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          alert("User not found");
          navigate("/profile");
        }
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        alert("Error fetching user");
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://localhost:3000/api/user/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        alert("User updated successfully");
        navigate("/profile");
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex flex-1 pt-16">
          <div className="bg-gray-800 text-white w-64 p-6 flex flex-col justify-between fixed h-full">
            <div>
              <h2 className="text-2xl font-bold mb-8 text-center">Admin Dashboard</h2>
              <ul className="space-y-4 mt-4">
                <li>
                  <button
                    onClick={() => navigate("/adminDash")}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                  >
                    <FaHome className="mr-2" /> Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/addRooms")}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                  >
                    <FaPlus className="mr-2" /> Add Rooms
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                  >
                    <FaUser className="mr-2" /> User Profile
                  </button>
                </li>
              </ul>
            </div>
            <div className="flex justify-between mt-auto space-x-2">
              <button
                onClick={() => navigate("/")}
                className="w-full px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm"
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
                className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="flex-1 ml-64 pt-4 flex items-center justify-center">
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col justify-between fixed h-full">
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">Admin Dashboard</h2>
            <ul className="space-y-4 mt-4">
              <li>
                <button
                  onClick={() => navigate("/adminDash")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                >
                  <FaHome className="mr-2" /> Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/addRooms")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                >
                  <FaPlus className="mr-2" /> Add Rooms
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm font-medium"
                >
                  <FaUser className="mr-2" /> User Profile
                </button>
              </li>
            </ul>
          </div>
          <div className="flex justify-between mt-auto space-x-2">
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm"
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
              className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 pt-4 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Edit User</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={user.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center text-sm"
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;