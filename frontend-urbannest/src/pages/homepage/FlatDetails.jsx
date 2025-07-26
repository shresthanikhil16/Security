import { faBath, faCar, faHome, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "tailwindcss/tailwind.css";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";
import Wishlist from "../../components/wishlist.jsx";

const FlatDetails = () => {
  const { id } = useParams();
  const [flat, setFlat] = useState(null);
  const [similarFlats, setSimilarFlats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [error, setError] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState("/fallback-image.png");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const flatResponse = await axios.get(`https://localhost:3000/api/rooms/${id}`);
        setFlat(flatResponse.data);
        // Preload background image with fallback
        const img = new Image();
        img.src = `https://localhost:3000/${flatResponse.data.roomImage}`;
        img.onload = () => setBackgroundImage(img.src);
        img.onerror = () => setBackgroundImage("/fallback-image.png");

        const allFlatsResponse = await axios.get("https://localhost:3000/api/rooms");
        const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        const similar = allFlatsResponse.data
          .filter((f) => f._id !== id && !wishlist.includes(f._id))
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSimilarFlats(similar);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load property details. Please try again.");
        setBackgroundImage("/fallback-image.png");
      }
    };
    fetchData();
  }, [id]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setSendStatus("Message cannot be empty");
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const htmlTemplate = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Inter', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background-color: #f9fafb;
                box-shadow: 0 4px 6px -1px rgba(75, 85, 99, 0.3);
              }
              .header {
                background: linear-gradient(to right, #38bdf8, #7dd3fc);
                padding: 8px;
                text-align: center;
                border-radius: 12px 12px 0 0;
              }
              .content {
                margin-top: 12px;
                padding: 8px;
              }
              .content h2 {
                color: #1f2937;
                font-size: 1.1rem;
                font-weight: 600;
              }
              .content p {
                margin: 6px 0;
                font-size: 0.85rem;
              }
              .footer {
                margin-top: 12px;
                text-align: center;
                color: #6b7280;
                font-size: 0.75rem;
              }
              .image {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                margin-top: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: white; font-size: 1.3rem; font-weight: 700;">UrbanNest</h1>
              </div>
              <div class="content">
                <h2>Inquiry Message:</h2>
                <p><strong>${message}</strong></p>
                <h3>Property Details:</h3>
                <p><strong>Description:</strong> ${flat.roomDescription}</p>
                <p><strong>Floor:</strong> ${flat.floor}</p>
                <p><strong>Address:</strong> ${flat.address}</p>
                <p><strong>Rent Price:</strong> ₹${flat.rentPrice}/month</p>
                <p><strong>Parking:</strong> ${flat.parking}</p>
                <p><strong>Contact No:</strong> ${flat.contactNo}</p>
                <p><strong>Bathrooms:</strong> ${flat.bathroom}</p>
                <img class="image" src="https://localhost:3000/${flat.roomImage}" alt="Property Image">
              </div>
              <div class="footer">
                <p>© 2025 Rentify - Kirtan Shrestha. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await axios.post("https://localhost:3000/api/email/send", {
        to: "officialblade007@gmail.com",
        subject: `Inquiry about Property ${flat._id}`,
        text: `Inquiry Message: ${message}\n\nProperty Details:\n${JSON.stringify(flat, null, 2)}`,
        html: htmlTemplate,
      });

      setSendStatus("Inquiry sent successfully!");
      setMessage("");
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (error) {
      setSendStatus(error.response?.data?.message || "Failed to send inquiry. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handlePayment = async (payment_method) => {
    const url = `https://localhost:3000/api/esewa/create/${id}`;
    const data = {
      amount: flat.rentPrice,
      products: [{ product: flat.roomDescription, amount: flat.rentPrice, quantity: 1 }],
      payment_method,
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.formData) {
          esewaCall(responseData.formData);
        } else {
          setError("Invalid payment data received.");
        }
      } else {
        setError(`Payment initiation failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      setError("Error initiating payment. Please try again.");
    }
  };

  const esewaCall = (formData) => {
    const path = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", path);

    for (const key in formData) {
      if (Object.hasOwnProperty.call(formData, key)) {
        const hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", formData[key]);
        form.appendChild(hiddenField);
      }
    }

    document.body.appendChild(form);
    form.submit();
  };

  if (error) {
    return <p className="text-center text-red-500 font-medium text-sm">Error: {error}</p>;
  }

  if (!flat) {
    return <p className="text-center text-gray-600 font-medium text-sm">Loading...</p>;
  }

  return (
    <div
      className="flex flex-col min-h-screen font-sans bg-gray-50 bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <style>
        {`
          .shadow-dark-grey {
            box-shadow: 0 10px 15px -3px rgba(75, 85, 99, 0.4), 0 4px 6px -2px rgba(75, 85, 99, 0.3);
          }
          .shadow-dark-grey:hover {
            box-shadow: 0 20px 25px -5px rgba(75, 85, 99, 0.5), 0 10px 10px -5px rgba(75, 85, 99, 0.3);
          }
          .background-overlay {
            background: rgba(255, 255, 255, 0.6);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 0;
            opacity: 0.4;
          }
          .content-container {
            position: relative;
            z-index: 10;
          }
        `}
      </style>
      <div className="background-overlay" />
      <div className="content-container flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow pt-12 px-3 pb-6">
          <div className="border border-gray-200 rounded-xl p-4 bg-white/80 shadow-dark-grey max-w-4xl mx-auto mb-6 transition-all duration-400">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center tracking-tight border-b border-gray-200 pb-2">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="w-full flex justify-center">
                <img
                  src={`https://localhost:3000/${flat.roomImage}`}
                  alt="Property"
                  className="w-full max-w-md h-80 object-cover rounded-xl border border-gray-200 shadow-sm"
                  onError={(e) => (e.target.src = "/fallback-image.png")}
                />
              </div>
              <div className="w-full bg-white/80 border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{flat.roomDescription}</h3>
                  <Wishlist flatId={flat._id} />
                </div>
                <div className="space-y-2">
                  <DetailItem
                    label="Price"
                    value={`₹${flat.rentPrice}/month`}
                    icon={<FontAwesomeIcon icon={faHome} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <DetailItem
                    label="Address"
                    value={flat.address}
                    icon={<FontAwesomeIcon icon={faHome} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <DetailItem
                    label="Floor"
                    value={flat.floor}
                    icon={<FontAwesomeIcon icon={faHome} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <DetailItem
                    label="Parking"
                    value={flat.parking}
                    icon={<FontAwesomeIcon icon={faCar} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <DetailItem
                    label="Contact"
                    value={flat.contactNo}
                    icon={<FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <DetailItem
                    label="Bathrooms"
                    value={flat.bathroom}
                    icon={<FontAwesomeIcon icon={faBath} className="w-4 h-4 text-sky-400 mr-2" />}
                  />
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-1.5 px-4 rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm"
                    aria-label="Inquire about this property"
                  >
                    Inquire Now
                  </button>
                  <button
                    onClick={() => handlePayment("esewa")}
                    className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-1.5 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm"
                    aria-label="Rent now with eSewa"
                  >
                    Rent with eSewa
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white/80 shadow-dark-grey max-w-4xl mx-auto transition-all duration-400">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center tracking-tight">Explore Similar Properties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarFlats.map((similarFlat) => (
                <Link
                  key={similarFlat._id}
                  to={`/flat-details/${similarFlat._id}`}
                  className="bg-white/80 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-sky-100 border border-transparent transition-all duration-400"
                >
                  <div className="flex justify-center">
                    <img
                      src={`https://localhost:3000/${similarFlat.roomImage}`}
                      alt="Similar property"
                      className="w-full max-w-xs h-40 object-cover rounded-t-xl"
                      onError={(e) => (e.target.src = "/fallback-image.png")}
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 tracking-tight">{similarFlat.roomDescription}</h4>
                    <p className="text-gray-700 mb-1 text-xs font-medium">₹{similarFlat.rentPrice}/month</p>
                    <p className="text-gray-600 text-xs">{similarFlat.address}</p>
                  </div>
                </Link>
              ))}
            </div>
            {similarFlats.length === 0 && (
              <p className="text-center text-gray-600 text-xs font-medium">No similar properties found</p>
            )}
          </div>
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50 transition-opacity duration-300" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white/80 rounded-xl shadow-md w-full max-w-sm p-4 transform transition-all duration-300 scale-100">
              <h3 id="modal-title" className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Inquire About This Property</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-24 p-2 border border-sky-200 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-gray-700 placeholder-gray-400 bg-white/95 text-xs"
                placeholder="Type your inquiry here..."
                maxLength="500"
                aria-label="Inquiry message input"
              />
              {sendStatus && (
                <p
                  className={`mb-2 text-xs font-medium ${sendStatus.includes("success") ? "text-green-500" : "text-red-500"}`}
                  role="alert"
                >
                  {sendStatus}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium text-xs"
                  aria-label="Cancel inquiry"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-3 py-1 rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed font-medium text-xs"
                  aria-label={isSending ? "Sending inquiry" : "Send inquiry"}
                >
                  {isSending ? "Sending..." : "Send Inquiry"}
                </button>
              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-center border-b border-sky-100 py-1.5">
    <span className="flex items-center text-gray-600 font-medium w-1/3 text-xs">
      {icon}
      {label}:
    </span>
    <span className="text-gray-700 font-semibold text-xs">{value}</span>
  </div>
);

export default FlatDetails;