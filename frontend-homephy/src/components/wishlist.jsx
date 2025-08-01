// components/Wishlist.jsx
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const Wishlist = ({ flatId, onWishlistChange }) => {
  const [isWishlist, setIsWishlist] = useState(false);

  useEffect(() => {
    console.log("Wishlist component received flatId:", flatId);

    // Validate flatId
    if (!flatId) {
      console.warn("Wishlist: flatId is null or undefined");
      setIsWishlist(false);
      return;
    }

    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    // Clean up null values from existing wishlist
    const cleanWishlist = storedWishlist.filter(id => id !== null && id !== undefined && id !== "");
    if (cleanWishlist.length !== storedWishlist.length) {
      localStorage.setItem("wishlist", JSON.stringify(cleanWishlist));
    }

    const isInWishlist = cleanWishlist.includes(flatId);
    console.log("Is in wishlist:", isInWishlist);
    setIsWishlist(isInWishlist);
  }, [flatId]);

  const handleWishlist = (e) => {
    console.log("Wishlist button clicked!");

    // Prevent event bubbling to parent elements
    e.preventDefault();
    e.stopPropagation();

    // Validate flatId before processing
    if (!flatId) {
      console.warn("Cannot add to wishlist: flatId is invalid:", flatId);
      return;
    }

    let storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    // Clean up any null values first
    storedWishlist = storedWishlist.filter(id => id !== null && id !== undefined && id !== "");

    let newWishlist;
    if (isWishlist) {
      newWishlist = storedWishlist.filter((id) => id !== flatId);
      console.log("Removed from wishlist:", flatId);
    } else {
      newWishlist = [...storedWishlist, flatId];
      console.log("Added to wishlist:", flatId);
    }

    localStorage.setItem("wishlist", JSON.stringify(newWishlist));
    setIsWishlist(!isWishlist);

    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'wishlist',
      newValue: JSON.stringify(newWishlist),
      oldValue: JSON.stringify(storedWishlist)
    }));

    if (onWishlistChange) {
      onWishlistChange(newWishlist);
    }
  };

  // Don't render the button if flatId is not available
  if (!flatId) {
    return null;
  }

  return (
    <button
      onClick={handleWishlist}
      className="relative z-10 p-2 bg-white/80 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-gray-200 hover:border-red-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
      title={isWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-label={isWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isWishlist ? (
        <FaHeart size={20} className="text-red-500 hover:text-red-600 transition-colors duration-200" />
      ) : (
        <FaRegHeart size={20} className="text-gray-500 hover:text-red-500 transition-colors duration-200" />
      )}
    </button>
  );
};

export default Wishlist;