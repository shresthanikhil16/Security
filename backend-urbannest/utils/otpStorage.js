// utils/otpStorage.js
const otpStorage = new Map();

const storeOTP = (email, otp, userData, expiresIn = 10 * 60 * 1000) => {
    const expiresAt = Date.now() + expiresIn; // 10 minutes
    otpStorage.set(email, { otp, userData, expiresAt });
};

const getOTP = (email) => {
    const data = otpStorage.get(email);
    if (data && data.expiresAt > Date.now()) {
        return data;
    }
    otpStorage.delete(email); // Clean up expired OTP
    return null;
};

const clearOTP = (email) => {
    otpStorage.delete(email);
};

module.exports = { storeOTP, getOTP, clearOTP };