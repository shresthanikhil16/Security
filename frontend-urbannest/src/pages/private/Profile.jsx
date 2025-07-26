import moment from "moment";
import { useEffect, useState } from "react";
import { FaEdit, FaHome, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const Profile = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://localhost:3000/api/user/customer", {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched users:", data);
        setUsers(data.users);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`https://localhost:3000/api/user/delete/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter((user) => user._id !== userId));
        alert("User deleted successfully");
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;