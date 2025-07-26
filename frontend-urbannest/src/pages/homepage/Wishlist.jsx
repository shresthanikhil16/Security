// components/Wishlist.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";

const Wishlist = () => {
  const [wishlistRooms, setWishlistRooms] = useState([]);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    fetch("https://localhost:3000/api/rooms")
      .then((res) => res.json())
      .then((allFlats) => {
        const wishlistFlats = allFlats.filter((flat) =>
          wishlist.includes(flat._id)
        );
        setWishlistRooms(wishlistFlats);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow px-6 pt-24 pb-16 max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-[#1A525E] mb-8 text-center">
            My Wishlist
          </h2>

          {/* Empty State */}
          {wishlistRooms.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-16">
              Your wishlist is empty. Explore rooms and add your favorites!
            </p>
          ) : (
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
