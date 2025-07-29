import { faBath, faCar, faHome, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "tailwindcss/tailwind.css";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";
import Wishlist from "../../components/wishlist.jsx";
import { useCSRFProtection } from "../../hooks/useCSRFProtection";

const FlatDetails = () => {
  const { id } = useParams();
  const [flat, setFlat] = useState(null);
  const [similarFlats, setSimilarFlts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [error, setError] = useState(null);
  const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const flatResponse = await axios.get(`https://localhost:3000/api/rooms/${id}`);

        // Extract the room data from the nested structure
        const roomData = flatResponse.data.room || flatResponse.data;
        setFlat(roomData);

        const allFlatsResponse = await axios.get("https://localhost:3000/api/rooms");
        const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

        // Handle different response formats
        const allFlatsData = allFlatsResponse.data.rooms || allFlatsResponse.data || [];
        const similar = allFlatsData
          .filter((f) => f._id !== id && !wishlist.includes(f._id))
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSimilarFlts(similar);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load property details. Please try again.");
      }
    };
    fetchData();
  }, [id]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setSendStatus("Message cannot be empty");
      return;
    }

    if (csrfLoading) {
      setSendStatus("Security initialization in progress. Please wait.");
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const htmlTemplate = `
        <html>
          <head>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
              .container { max-width: 500px; margin: 0 auto; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; box-shadow: 0 4px 6px -1px rgba(75, 85, 99, 0.3); }
              .header { background: linear-gradient(to right, #38bdf8, #7dd3fc); padding: 8px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { margin-top: 12px; padding: 8px; }
              .content h2 { color: #1f2937; font-size: 1.1rem; font-weight: 600; }
              .content p { margin: 6px 0; font-size: 0.85rem; }
              .footer { margin-top: 12px; text-align: center; color: #6b7280; font-size: 0.75rem; }
              .image { max-width: 100%; height: auto; border-radius: 12px; margin-top: 8px; }
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
                ${flat.roomImage ? `<img class="image" src="https://localhost:3000/${flat.roomImage}" alt="Property Image" crossorigin="anonymous">` : '<p><em>No image available</em></p>'}
              </div>
              <div class="footer">
                <p>© 2025 Rentify - Kirtan Shrestha. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      if (secureAxios && typeof secureAxios.post === 'function') {
        await secureAxios.post("/api/email/send", {
          to: "officialblade007@gmail.com",
          subject: `Inquiry about Property ${flat._id}`,
          text: `Inquiry Message: ${message}\n\nProperty Details:\n${JSON.stringify(flat, null, 2)}`,
          html: htmlTemplate,
        });
      } else {
        await axios.post("https://localhost:3000/api/email/send", {
          to: "officialblade007@gmail.com",
          subject: `Inquiry about Property ${flat._id}`,
          text: `Inquiry Message: ${message}\n\nProperty Details:\n${JSON.stringify(flat, null, 2)}`,
          html: htmlTemplate,
        });
      }

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
    if (isPaymentLoading) return;

    if (csrfLoading) {
      setError("Security initialization in progress. Please wait.");
      return;
    }

    setIsPaymentLoading(true);
    const data = {
      amount: flat.rentPrice,
      products: [{ product: flat.roomDescription, amount: flat.rentPrice, quantity: 1 }],
      payment_method,
    };

    try {
      let response;

      if (secureAxios && typeof secureAxios.post === 'function') {
        response = await secureAxios.post(`/api/esewa/create/${id}`, data);
      } else {
        response = await axios.post(`https://localhost:3000/api/esewa/create/${id}`, data, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (response.data.formData) {
        esewaCall(response.data.formData);
      } else {
        setError("Invalid payment data received from server.");
      }
    } catch (error) {
      setError(`Payment initiation failed: ${error.message}`);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const esewaCall = (formData) => {
    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

    Object.keys(formData).forEach(key => {
      const hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", key);
      hiddenField.setAttribute("value", formData[key]);
      form.appendChild(hiddenField);
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  };

  if (error) {
    return <p className="text-center text-red-500 font-medium text-sm">Error: {error}</p>;
  }

  if (!flat) {
    return <p className="text-center text-gray-600 font-medium text-sm">Loading...</p>;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100">
      <div className="content-container flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow pt-16 px-4 pb-8">
          {/* Hero Section with Property Image */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left Side - Large Property Image */}
                <div className="relative h-96 lg:h-full min-h-[500px]">
                  <ImageWithFallback
                    src={flat.roomImage ? `https://localhost:3000/${flat.roomImage}` : "/urbannest.png"}
                    fallbackSrc="/urbannest.png"
                    alt="Property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Wishlist flatId={flat._id || id} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h1 className="text-white text-2xl lg:text-3xl font-bold mb-2">{flat.roomDescription}</h1>
                    <p className="text-white/90 text-lg font-semibold">₹{flat.rentPrice}/month</p>
                  </div>
                </div>

                {/* Right Side - Property Details */}
                <div className="p-8 lg:p-10">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">Property Details</h2>
                      <div className="space-y-4">
                        <DetailItem
                          label="Address"
                          value={flat.address || 'Not specified'}
                          icon={<FontAwesomeIcon icon={faHome} className="w-5 h-5 text-blue-500 mr-3" />}
                        />
                        <DetailItem
                          label="Floor"
                          value={flat.floor || 'Not specified'}
                          icon={<FontAwesomeIcon icon={faHome} className="w-5 h-5 text-blue-500 mr-3" />}
                        />
                        <DetailItem
                          label="Parking"
                          value={flat.parking || 'Not specified'}
                          icon={<FontAwesomeIcon icon={faCar} className="w-5 h-5 text-blue-500 mr-3" />}
                        />
                        <DetailItem
                          label="Contact"
                          value={flat.contactNo || flat.contact || 'Not specified'}
                          icon={<FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-blue-500 mr-3" />}
                        />
                        <DetailItem
                          label="Bathrooms"
                          value={flat.bathroom || flat.bathrooms || 'Not specified'}
                          icon={<FontAwesomeIcon icon={faBath} className="w-5 h-5 text-blue-500 mr-3" />}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-base"
                        aria-label="Inquire about this property"
                      >
                        Inquire Now
                      </button>
                      <button
                        onClick={() => handlePayment("esewa")}
                        disabled={isPaymentLoading || csrfLoading}
                        className={`w-full py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-base ${isPaymentLoading || csrfLoading
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-70'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                          }`}
                        aria-label="Rent now with eSewa"
                      >
                        {isPaymentLoading ? 'Processing...' : 'Rent with eSewa'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Properties Section */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Explore Similar Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarFlats.map((similarFlat) => (
                  <Link
                    key={similarFlat._id}
                    to={`/flat-details/${similarFlat._id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative h-48">
                      <ImageWithFallback
                        src={similarFlat.roomImage ? `https://localhost:3000/${similarFlat.roomImage}` : "/urbannest.png"}
                        fallbackSrc="/urbannest.png"
                        alt="Similar property"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white font-bold text-lg">₹{similarFlat.rentPrice}/month</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{similarFlat.roomDescription}</h4>
                      <p className="text-gray-600 text-sm line-clamp-2">{similarFlat.address}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {similarFlats.length === 0 && (
                <p className="text-center text-gray-600 text-lg font-medium py-8">No similar properties found</p>
              )}
            </div>
          </div>
        </div>

        {/* Inquiry Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-100">
              <h3 id="modal-title" className="text-2xl font-bold text-gray-900 mb-4">Inquire About This Property</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 p-4 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 placeholder-gray-400 bg-white resize-none"
                placeholder="Type your inquiry here..."
                maxLength="500"
                aria-label="Inquiry message input"
              />
              {sendStatus && (
                <p
                  className={`mb-4 text-sm font-medium ${sendStatus.includes("success") ? "text-green-600" : "text-red-600"}`}
                  role="alert"
                >
                  {sendStatus}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                  aria-label="Cancel inquiry"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
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

const ImageWithFallback = ({ src, fallbackSrc, alt, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);

      // Try HTTP if HTTPS failed
      if (src.startsWith('https://localhost:3000/')) {
        const httpSrc = src.replace('https://', 'http://');
        setImgSrc(httpSrc);
      } else {
        // Use fallback if HTTP also fails
        setImgSrc(fallbackSrc);
      }
    } else {
      // Already tried alternative, use fallback
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      crossOrigin="anonymous"
      {...props}
    />
  );
};

const DetailItem = ({ label, value, icon }) => {
  const displayValue = value || 'Not specified';

  return (
    <div className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="flex items-center text-gray-600 font-medium w-1/3">
        {icon}
        {label}:
      </span>
      <span className="text-gray-900 font-semibold text-sm">{displayValue}</span>
    </div>
  );
};

export default FlatDetails;
