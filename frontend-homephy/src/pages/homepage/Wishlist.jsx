// components/Wishlist.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";

const Wishlist = () => {
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlistRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

      // Clean up null values
      const cleanWishlist = wishlist.filter(id => id !== null && id !== undefined && id !== "");
      if (cleanWishlist.length !== wishlist.length) {
        localStorage.setItem("wishlist", JSON.stringify(cleanWishlist));
        wishlist = cleanWishlist;
      }

      if (wishlist.length === 0) {
        setWishlistRooms([]);
        setLoading(false);
        return;
      }

      const response = await fetch("https://localhost:3000/api/rooms");
      const data = await response.json();

      // Handle different response formats
      const allFlats = data.rooms || data || [];

      if (Array.isArray(allFlats)) {
        const wishlistFlats = allFlats.filter((flat) => wishlist.includes(flat._id));
        setWishlistRooms(wishlistFlats);
      } else {
        console.error("Expected array but got:", typeof allFlats);
        setError("Invalid data format received from server");
        setWishlistRooms([]);
      }
    } catch (error) {
      console.error("Error fetching wishlist rooms:", error);
      setError("Failed to load wishlist items");
      setWishlistRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistRooms();
  }, []);

  // Listen for storage changes (when items are added/removed from other pages)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'wishlist') {
        fetchWishlistRooms();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWishlistRooms();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow px-6 pt-24 pb-16 max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#1A525E]">
              My Wishlist
            </h2>
            <button
              onClick={fetchWishlistRooms}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <p className="text-center text-gray-500 text-lg py-16">
              Loading your wishlist...
            </p>
          )}

          {/* Empty State */}
          {!loading && !error && wishlistRooms.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">
                Your wishlist is empty. Explore rooms and add your favorites!
              </p>
            </div>
          )}

          {/* Wishlist Items */}
          {!loading && !error && wishlistRooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {wishlistRooms.map((room) => (
                <div
                  key={room._id}
                  className="group relative bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Room Image */}
                  <img
                    src={`https://localhost:3000/${room.roomImage}`}
                    alt="Room"
                    className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => (e.target.src = "/fallback-image.png")}
                  />

                  {/* Room Details */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold text-[#1A525E] truncate">
                      {room.roomDescription}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      ₹{room.rentPrice} / month
                    </p>
                    <p className="text-gray-500 text-sm">{room.address}</p>
                  </div>

                  {/* Hover Overlay CTA */}
                  <Link
                    to={`/flat-details/${room._id}`}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-sm"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Wishlist;
