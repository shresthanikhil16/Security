const crypto = require("crypto");
const { v4 } = require("uuid");
const { sanitizePaymentInput } = require("../utils/xssProtection");

/**
 * Create an eSewa order
 */
exports.createOrder = async (req, res) => {
  try {
    // Sanitize and extract data from the request body
    const sanitizedBody = sanitizePaymentInput(req.body);
    const { amount, products, payment_method } = sanitizedBody;

    console.log("Request body received:", req.body);
    console.log("Sanitized body:", sanitizedBody);

    const roomId = req.params.id; // Get the room ID from the URL params

    // Handle different data structures - amount might be in products or direct
    let finalAmount = amount;

    if (!finalAmount && products && products.length > 0) {
      // If amount is not provided directly, try to extract from products
      const product = products[0];
      if (product && product.amount) {
        finalAmount = product.amount;
      } else if (product && product.price) {
        finalAmount = product.price;
      }
    }

    // If still no amount, we need to fetch it from the room data
    if (!finalAmount || isNaN(finalAmount) || Number(finalAmount) <= 0) {
      // Import Room model to fetch the rent price
      const Room = require("../models/roomsModel");

      try {
        const room = await Room.findById(roomId);
        if (!room) {
          return res.status(404).json({
            success: false,
            message: "Room not found"
          });
        }

        finalAmount = room.rentPrice;
        console.log("Fetched amount from room data:", finalAmount);

      } catch (dbError) {
        console.error("Error fetching room data:", dbError);
        return res.status(500).json({
          success: false,
          message: "Error fetching room information"
        });
      }
    }

    // Final validation
    if (!finalAmount || isNaN(finalAmount) || Number(finalAmount) <= 0) {
      console.error("Invalid amount after all checks:", finalAmount);
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
        received: { amount: finalAmount, type: typeof finalAmount, originalBody: req.body }
      });
    }

    const transactionUuid = `${roomId}-${v4()}`; // Create a unique transaction ID
    console.log("Room ID and Final Amount:", roomId, finalAmount);

    const signatureMessage = `total_amount=${finalAmount},transaction_uuid=${transactionUuid},product_code=EPAYTEST`;
    const signature = createSignature(signatureMessage);

    const formData = {
      amount: finalAmount,
      total_amount: finalAmount,
      tax_amount: "0",
      product_service_charge: "0",
      product_delivery_charge: "0",
      product_code: "EPAYTEST",
      transaction_uuid: transactionUuid,
      success_url: "https://localhost:5173/success",
      failure_url: "https://localhost:5173/failure",
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    return res.json({
      message: "Order Created Successfully",
      formData,
      payment_method: "esewa",
    });
  } catch (err) {
    console.error("Error in createOrder:", err);
    return res.status(500).json({ message: "Server error while creating order" });
  }
};

/**
 * Verify eSewa payment callback
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ message: "Missing payment verification data." });
    }

    const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    console.log("Decoded Payment Data:", decodedData);

    if (decodedData.status !== "COMPLETE") {
      console.warn("Payment not complete");
      return res.redirect("https://localhost:5173/failure");
    }

    const signedFields = decodedData.signed_field_names
      .split(",")
      .map((field) => `${field}=${decodedData[field] || ""}`)
      .join(",");

    console.log("Signed field message:", signedFields);

    const roomId = decodedData.transaction_uuid.split("-")[0];
    console.log("Verified Room ID:", roomId);

    return res.redirect("https://localhost:5173/success");
  } catch (err) {
    console.error("Error verifying payment:", err.message);
    return res.status(400).json({ error: err.message || "Payment verification failed" });
  }
};

/**
 * Generate HMAC-SHA256 signature
 */
function createSignature(message) {
  const secret = "8gBm/:&EnhH.1/q"; // This should be securely stored in production
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  return hmac.digest("base64");
}

exports.createSignature = createSignature;
