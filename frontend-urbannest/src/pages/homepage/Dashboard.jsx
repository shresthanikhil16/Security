import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "tailwindcss/tailwind.css";
import Footer from "../../components/Footer.jsx";
import Navbar from "../../components/Navbar.jsx";

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Dashboard = () => {
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nearbyFlats, setNearbyFlats] = useState([]);
  const [filteredNearbyFlats, setFilteredNearbyFlats] = useState([]);
  const [location, setLocation] = useState({ latitude: 27.7172, longitude: 85.324 });
  const [nearbyError, setNearbyError] = useState(null);
  const [nearbyFilters] = useState({ maxPrice: "", bathroom: "", parking: "" });
  const [nearbyFlatIndex, setNearbyFlatIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs for sections to observe
  const heroRef = useRef(null);
  const nearbySectionRef = useRef(null);
  const propertiesSectionRef = useRef(null);

  const heroImages = [
    "../../src/assets/images/apt1.jpg",
    "../../src/assets/images/apt2.jpg",
    "../../src/assets/images/apt3.jpg",
  ];

  useEffect(() => {
    fetch("https://localhost:3000/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        setFlats(data);
        setFilteredFlats(data);
      })
      .catch((error) => console.error("Error fetching rooms:", error));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          try {
            const response = await axios.post("https://localhost:3000/api/rooms/nearby", {
              latitude,
              longitude,
              radius: 5000,
              maxPrice: nearbyFilters.maxPrice ? Number(nearbyFilters.maxPrice) : undefined,
              bathroom: nearbyFilters.bathroom ? Number(nearbyFilters.bathroom) : undefined,
              parking: nearbyFilters.parking || undefined,
            });
            setNearbyFlats(response.data);
            setFilteredNearbyFlats(response.data);
            setNearbyError(null);
          } catch (err) {
            setNearbyError("Failed to fetch nearby rooms: " + err.message);
          }
        },
        (err) => {
          setNearbyError("Geolocation error: " + err.message);
        }
      );
    } else {
      setNearbyError("Geolocation is not supported by this browser.");
    }
  }, [nearbyFilters]);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query === "") {
      setFilteredFlats(flats);
      setFilteredNearbyFlats(nearbyFlats);
    } else {
      const filtered = flats.filter((flat) =>
        flat.address?.toLowerCase().includes(query)
      );
      const filteredNearby = nearbyFlats.filter((flat) =>
        flat.address?.toLowerCase().includes(query)
      );
      setFilteredFlats(filtered);
      setFilteredNearbyFlats(filteredNearby);
    }
  }, [searchQuery, flats, nearbyFlats]);

  useEffect(() => {
    if (filteredFlats.length > 4) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % (filteredFlats.length - 3));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [filteredFlats.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);

    if (heroRef.current) observer.observe(heroRef.current);
    if (nearbySectionRef.current) observer.observe(nearbySectionRef.current);
    if (propertiesSectionRef.current) observer.observe(propertiesSectionRef.current);

    return () => {
      if (heroRef.current) observer.unobserve(heroRef.current);
      if (nearbySectionRef.current) observer.unobserve(nearbySectionRef.current);
      if (propertiesSectionRef.current) observer.unobserve(propertiesSectionRef.current);
    };
  }, []);

  const getVisibleFlats = () => {
    if (filteredFlats.length <= 4) return filteredFlats;
    return filteredFlats.slice(activeIndex, activeIndex + 4);
  };

  const getVisibleNearbyFlats = () => {
    if (filteredNearbyFlats.length <= 2) return filteredNearbyFlats;
    return filteredNearbyFlats.slice(nearbyFlatIndex, nearbyFlatIndex + 2);
  };

  const handleNearbyFlatNext = () => {
    setNearbyFlatIndex((prev) => (prev + 2) % filteredNearbyFlats.length);
  };

  const handleNearbyFlatPrev = () => {
    setNearbyFlatIndex((prev) => (prev - 2 + filteredNearbyFlats.length) % filteredNearbyFlats.length);
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (query === "") {
      setFilteredFlats(flats);
      setFilteredNearbyFlats(nearbyFlats);
    } else {
      const filtered = flats.filter((flat) =>
        flat.address?.toLowerCase().includes(query)
      );
      const filteredNearby = nearbyFlats.filter((flat) =>
        flat.address?.toLowerCase().includes(query)
      );
      setFilteredFlats(filtered);
      setFilteredNearbyFlats(filteredNearby);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} />

      {/* Hero Banner with Animation */}
      <div
        ref={heroRef}
        className="relative w-[95%] h-[500px] md:h-[450px] rounded-3xl overflow-hidden mt-6 shadow-xl mx-auto mt-20 opacity-0 transition-all duration-1000 ease-out"
      >
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${heroImageIndex === index ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="flex w-full max-w-2xl items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-300 shadow-md rounded-full px-4 py-2 animate-slide-up">
            <span className="text-gray-500">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search district, metro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none placeholder-gray-500 text-base text-gray-800 font-medium"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold transition"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Properties Near You */}
      <div ref={nearbySectionRef} className="px-6 py-12 bg-gradient-to-b from-gray-50 to-gray-100 opacity-0 transition-all duration-1000 ease-out">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-center animate-slide-up">
          <span className="text-gray-900">Properties </span>
          <span className="text-blue-600">Near You</span>
        </h2>
        {nearbyError ? (
          <p className="text-red-600 text-center text-lg font-medium animate-slide-up">{nearbyError}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {filteredNearbyFlats.length > 0 ? (
                getVisibleNearbyFlats().map((room, index) => (
                  <Link
                    to={`/flat-details/${room._id}`}
                    key={index}
                    className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:border-blue-300 border border-transparent block opacity-0 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative">
                      <img
                        src={
                          room.roomImage
                            ? `https://localhost:3000/${room.roomImage}`
                            : "../../src/assets/images/placeholder.jpg"
                        }
                        alt={room.roomDescription || "Property"}
                        className="w-full h-56 object-cover rounded-t-3xl"
                      />
                      {room.parking && (
                        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                          Parking Available
                        </span>
                      )}
                    </div>
                    <div className="p-6 text-left">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                        {room.address}
                      </h3>
                      <p className="text-green-600 font-medium text-lg mb-2">
                        ₹{room.rentPrice} / month
                      </p>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {room.roomDescription}
                      </p>
                      <p className="text-blue-600 font-semibold text-sm hover:underline transition-colors">
                        View Details →
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-gray-600 text-center text-lg font-medium animate-slide-up">
                  {searchQuery
                    ? "No properties match your search."
                    : "No nearby properties available."}
                </p>
              )}
            </div>
            {filteredNearbyFlats.length > 2 && (
              <div className="flex justify-center mt-10 space-x-4 animate-slide-up">
                <button
                  onClick={handleNearbyFlatPrev}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Previous
                </button>
                <button
                  onClick={handleNearbyFlatNext}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Available Properties */}
      <div ref={propertiesSectionRef} className="px-6 py-12 bg-white opacity-0 transition-all duration-1000 ease-out">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-center animate-slide-up">
          <span className="text-gray-900">Available </span>
          <span className="text-blue-600">Properties</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {filteredFlats.length > 0 ? (
            getVisibleFlats().map((flat, index) => (
              <Link
                to={`/flat-details/${flat._id}`}
                key={index}
                className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:border-blue-300 border border-transparent block opacity-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <img
                    src={
                      flat.roomImage
                        ? `https://localhost:3000/${flat.roomImage}`
                        : "../../src/assets/images/placeholder.jpg"
                    }
                    alt={flat.roomDescription || "Property"}
                    className="w-full h-56 object-cover rounded-t-3xl"
                  />
                  {flat.parking && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Parking Available
                    </span>
                  )}
                </div>
                <div className="p-6 text-left">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                    {flat.address}
                  </h3>
                  <p className="text-green-600 font-medium text-lg mb-2">
                    ₹{flat.rentPrice} / month
                  </p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {flat.roomDescription}
                  </p>
                  <p className="text-blue-600 font-semibold text-sm hover:underline transition-colors">
                    View Details →
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-gray-600 text-center text-lg font-medium animate-slide-up">
              {searchQuery ? "No properties match your search." : "No rooms available."}
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;