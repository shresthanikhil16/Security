import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { FaHome, FaPlus } from "react-icons/fa";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const AdminUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { flat: room } = state || {};
  const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

  const [formData, setFormData] = useState({
    roomDescription: "",
    floor: "",
    address: "",
    rentPrice: "",
    parking: "",
    contactNo: "",
    bathroom: "",
    location: { type: "Point", coordinates: [85.324, 27.7172] }, // Default: Kathmandu
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect triggered - room:", room, "csrfLoading:", csrfLoading, "secureAxios:", !!secureAxios);

    if (room) {
      console.log("Using room data from state:", room);
      setFormData({
        roomDescription: room.roomDescription || "",
        floor: room.floor || "",
        address: room.address || "",
        rentPrice: room.rentPrice || "",
        parking: room.parking || "",
        contactNo: room.contactNo || "",
        bathroom: room.bathroom || "",
        location: room.location || { type: "Point", coordinates: [85.324, 27.7172] },
      });
      setLoading(false);
    } else if (!csrfLoading && secureAxios && typeof secureAxios.get === 'function') {
      // Use secureAxios when available and CSRF is ready
      console.log("Fetching room data using secureAxios for ID:", id);
      secureAxios.get(`/api/rooms/${id}`)
        .then((response) => {
          const data = response.data;
          console.log("Received room data from secureAxios:", data);
          setFormData({
            roomDescription: data.roomDescription || "",
            floor: data.floor || "",
            address: data.address || "",
            rentPrice: data.rentPrice || "",
            parking: data.parking || "",
            contactNo: data.contactNo || "",
            bathroom: data.bathroom || "",
            location: data.location || { type: "Point", coordinates: [85.324, 27.7172] },
          });
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching room details with secureAxios:", error);
          // Fallback to regular fetch
          console.log("Falling back to regular fetch for ID:", id);
          fetch(`https://localhost:3000/api/rooms/${id}`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Received room data from fallback fetch:", data);
              setFormData({
                roomDescription: data.roomDescription || "",
                floor: data.floor || "",
                address: data.address || "",
                rentPrice: data.rentPrice || "",
                parking: data.parking || "",
                contactNo: data.contactNo || "",
                bathroom: data.bathroom || "",
                location: data.location || { type: "Point", coordinates: [85.324, 27.7172] },
              });
              setLoading(false);
            })
            .catch((fallbackError) => {
              console.error("Fallback fetch also failed:", fallbackError);
              setLoading(false);
            });
        });
    } else if (!csrfLoading && (!secureAxios || typeof secureAxios.get !== 'function')) {
      // Fallback when secureAxios is not available or not properly initialized
      console.log("Using direct fetch (no secureAxios) for ID:", id);
      fetch(`https://localhost:3000/api/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Received room data from direct fetch:", data);
          setFormData({
            roomDescription: data.roomDescription || "",
            floor: data.floor || "",
            address: data.address || "",
            rentPrice: data.rentPrice || "",
            parking: data.parking || "",
            contactNo: data.contactNo || "",
            bathroom: data.bathroom || "",
            location: data.location || { type: "Point", coordinates: [85.324, 27.7172] },
          });
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching room details:", error);
          setLoading(false);
        });
    }
  }, [room, id, csrfLoading, secureAxios]);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log("FormData state updated:", formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates:
          name === "latitude"
            ? [formData.location.coordinates[0], Number(value)]
            : [Number(value), formData.location.coordinates[1]],
      },
    });
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setFormData({
          ...formData,
          location: {
            type: "Point",
            coordinates: [e.latlng.lng, e.latlng.lat],
          },
        });
      },
    });
    return (
      <Marker
        position={[formData.location.coordinates[1], formData.location.coordinates[0]]}
      />
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log the form data being sent
    console.log("Form data to be sent:", formData);
    console.log("Selected image:", selectedImage);

    // Validate that required fields are not empty
    if (!formData.roomDescription || !formData.address || !formData.contactNo) {
      alert("Please fill in all required fields");
      return;
    }

    // Ensure numeric fields are properly formatted
    const numericFloor = Number(formData.floor) || 0;
    const numericRentPrice = Number(formData.rentPrice) || 0;
    const numericBathroom = Number(formData.bathroom) || 0;

    const formDataToSend = new FormData();
    formDataToSend.append("roomDescription", formData.roomDescription);
    formDataToSend.append("floor", numericFloor.toString());
    formDataToSend.append("address", formData.address);
    formDataToSend.append("rentPrice", numericRentPrice.toString());
    formDataToSend.append("parking", formData.parking);
    formDataToSend.append("contactNo", formData.contactNo);
    formDataToSend.append("bathroom", numericBathroom.toString());
    formDataToSend.append("location", JSON.stringify(formData.location));
    if (selectedImage) {
      formDataToSend.append("roomImage", selectedImage);
    }

    // Debug: Log FormData contents
    console.log("FormData contents:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    try {
      if (secureAxios && typeof secureAxios.put === 'function') {
        // Use secure axios if available
        await secureAxios.put(`/api/rooms/${id}`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Fallback to regular fetch
        console.warn("secureAxios not available, using fallback for updating room");
        const response = await fetch(`https://localhost:3000/api/rooms/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Update failed:", response.status, response.statusText);
          console.error("Error response:", errorData);
          throw new Error(`Failed to update room: ${response.status} - ${errorData}`);
        }
      }

      alert("Room updated successfully");
      navigate("/adminDash");
    } catch (error) {
      console.error("Error updating room:", error);
      alert(`Error updating room: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      {(loading || csrfLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p>Loading...</p>
          </div>
        </div>
      )}
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
          <div className="max-w-4xl mx-auto bg-white border-4 border-gray-300 rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-center">
              {loading ? "Loading Room Details..." : "Update Room Details"}
            </h3>
            {loading ? (
              <div className="text-center text-gray-600">
                Please wait while we load the room details...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Image</label>
                  <input
                    type="file"
                    name="roomImage"
                    onChange={handleImageChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                    accept="image/*"
                  />
                  {formData.roomImage && (
                    <img
                      src={selectedImage ? URL.createObjectURL(selectedImage) : `https://localhost:3000/${formData.roomImage}`}
                      alt="Room Preview"
                      className="mt-4 w-32 h-32 object-cover rounded-md"
                    />
                  )}
                </div>

                {/* Room Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Description</label>
                  <input
                    type="text"
                    name="roomDescription"
                    value={formData.roomDescription}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Floor</label>
                  <select
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select Floor</option>
                    {[1, 2, 3, 4].map((floor) => (
                      <option key={floor} value={floor}>
                        {floor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Rent Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rent Price</label>
                  <input
                    type="number"
                    name="rentPrice"
                    value={formData.rentPrice}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Parking */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parking</label>
                  <select
                    name="parking"
                    value={formData.parking}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select Parking</option>
                    <option value="available">Available</option>
                    <option value="not available">Not Available</option>
                  </select>
                </div>

                {/* Contact No */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Bathroom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <select
                    name="bathroom"
                    value={formData.bathroom}
                    onChange={handleChange}
                    className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select Bathrooms</option>
                    {[1, 2, 3].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <div className="flex space-x-4 mt-2">
                    <input
                      type="number"
                      name="latitude"
                      value={formData.location.coordinates[1]}
                      onChange={handleCoordinateChange}
                      className="p-3 w-full border border-gray-300 rounded-md text-sm"
                      placeholder="Latitude"
                      step="any"
                    />
                    <input
                      type="number"
                      name="longitude"
                      value={formData.location.coordinates[0]}
                      onChange={handleCoordinateChange}
                      className="p-3 w-full border border-gray-300 rounded-md text-sm"
                      placeholder="Longitude"
                      step="any"
                    />
                  </div>
                  <div className="mt-4">
                    <MapContainer
                      center={[formData.location.coordinates[1], formData.location.coordinates[0]]}
                      zoom={13}
                      style={{ height: "300px", width: "100%" }}
                      className="rounded-lg shadow-md"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <LocationMarker />
                    </MapContainer>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-md"
                  >
                    Update Room
                  </button>
                  <button
                    onClick={() => navigate("/adminDash")}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;