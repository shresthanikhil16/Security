import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { FaHome, FaUser } from "react-icons/fa";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";
import Navbar from "../../components/Navbar";

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const AddRooms = () => {
  const [roomDetails, setRoomDetails] = useState({
    roomDescription: "",
    floor: "",
    address: "",
    rentPrice: "",
    parking: "",
    contactNo: "",
    bathroom: "",
    roomImage: null,
    location: { type: "Point", coordinates: [85.324, 27.7172] }, // Default: Kathmandu
  });
  const navigate = useNavigate();

  // Predefined locations
  const locations = [
    { name: "Kathmandu", coordinates: [85.324, 27.7172] },
    { name: "Lalitpur", coordinates: [85.316, 27.6766] },
    { name: "Bhaktapur", coordinates: [85.429, 27.672] },
  ];

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoomDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  // Handle image upload with validation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed image MIME types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    // Disallowed extensions
    const disallowedExtensions = [".txt", ".php"];

    // Check file extension
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (disallowedExtensions.includes(fileExtension)) {
      toast.error(`Files with ${fileExtension} extension are not allowed. Please upload an image file.`);
      return;
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and GIF images are allowed.");
      return;
    }

    setRoomDetails((prevDetails) => ({
      ...prevDetails,
      roomImage: file,
    }));
  };

  // Handle phone number input
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      setRoomDetails((prevDetails) => ({
        ...prevDetails,
        contactNo: value,
      }));
    }
  };

  // Handle rent price input
  const handleRentPriceChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,7}$/.test(value)) {
      setRoomDetails((prevDetails) => ({
        ...prevDetails,
        rentPrice: value,
      }));
    }
  };

  // Handle location dropdown change
  const handleLocationSelect = (e) => {
    const selectedLocation = locations.find((loc) => loc.name === e.target.value);
    if (selectedLocation) {
      setRoomDetails((prevDetails) => ({
        ...prevDetails,
        location: {
          type: "Point",
          coordinates: selectedLocation.coordinates,
        },
      }));
    }
  };

  // Handle manual coordinate changes
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setRoomDetails((prevDetails) => ({
      ...prevDetails,
      location: {
        ...prevDetails.location,
        coordinates:
          name === "latitude"
            ? [prevDetails.location.coordinates[0], Number(value)]
            : [Number(value), prevDetails.location.coordinates[1]],
      },
    }));
  };

  // Map click handler
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setRoomDetails((prevDetails) => ({
          ...prevDetails,
          location: {
            type: "Point",
            coordinates: [e.latlng.lng, e.latlng.lat],
          },
        }));
      },
    });
    return (
      <Marker
        position={[roomDetails.location.coordinates[1], roomDetails.location.coordinates[0]]}
      />
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !roomDetails.roomDescription ||
      !roomDetails.floor ||
      !roomDetails.address ||
      !roomDetails.rentPrice ||
      !roomDetails.contactNo ||
      !roomDetails.bathroom ||
      !roomDetails.parking ||
      !roomDetails.location.coordinates[0] ||
      !roomDetails.location.coordinates[1]
    ) {
      toast.error("Please fill out all required fields, including location.");
      return;
    }

    if (roomDetails.contactNo.length !== 10) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }

    const formData = new FormData();
    formData.append("roomDescription", roomDetails.roomDescription);
    formData.append("floor", roomDetails.floor);
    formData.append("address", roomDetails.address);
    formData.append("rentPrice", roomDetails.rentPrice);
    formData.append("parking", roomDetails.parking);
    formData.append("contactNo", roomDetails.contactNo);
    formData.append("bathroom", roomDetails.bathroom);
    formData.append("location", JSON.stringify(roomDetails.location));
    if (roomDetails.roomImage) {
      formData.append("roomImage", roomDetails.roomImage);
    }

    try {
      await axios.post("https://localhost:3000/api/rooms", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
      });

      toast.success("Room added successfully!");
      navigate("/adminDash");
    } catch (error) {
      console.error("Error adding room:", error);
      toast.error("Error adding room. Please try again.");
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
            <h3 className="text-2xl font-semibold mb-6 text-center">Add New Room</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Image</label>
                <input
                  type="file"
                  name="roomImage"
                  onChange={handleImageUpload}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  accept="image/jpeg,image/png,image/gif"
                />
                {roomDetails.roomImage && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(roomDetails.roomImage)}
                      alt="Room preview"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Room Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Description</label>
                <input
                  type="text"
                  name="roomDescription"
                  value={roomDetails.roomDescription}
                  onChange={handleInputChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  placeholder="Enter room description"
                />
              </div>

              {/* Floor */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Floor</label>
                <select
                  name="floor"
                  value={roomDetails.floor}
                  onChange={handleInputChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select floor</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={roomDetails.address}
                  onChange={handleInputChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  placeholder="Enter address"
                />
              </div>

              {/* Rent Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Price</label>
                <input
                  type="text"
                  name="rentPrice"
                  value={roomDetails.rentPrice}
                  onChange={handleRentPriceChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  placeholder="Enter rent price"
                />
              </div>

              {/* Parking */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Parking</label>
                <select
                  name="parking"
                  value={roomDetails.parking}
                  onChange={handleInputChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select parking availability</option>
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
                  value={roomDetails.contactNo}
                  onChange={handlePhoneChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                  placeholder="Enter contact number"
                />
              </div>

              {/* Bathroom */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                <select
                  name="bathroom"
                  value={roomDetails.bathroom}
                  onChange={handleInputChange}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select number of bathrooms</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <select
                  name="location"
                  onChange={handleLocationSelect}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a city</option>
                  {locations.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-4 mt-2">
                  <input
                    type="number"
                    name="latitude"
                    value={roomDetails.location.coordinates[1]}
                    onChange={handleCoordinateChange}
                    className="p-3 w-full border border-gray-300 rounded-md text-sm"
                    placeholder="Latitude"
                    step="any"
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={roomDetails.location.coordinates[0]}
                    onChange={handleCoordinateChange}
                    className="p-3 w-full border border-gray-300 rounded-md text-sm"
                    placeholder="Longitude"
                    step="any"
                  />
                </div>
                <div className="mt-4">
                  <MapContainer
                    center={[roomDetails.location.coordinates[1], roomDetails.location.coordinates[0]]}
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
              <div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-md"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AddRooms;