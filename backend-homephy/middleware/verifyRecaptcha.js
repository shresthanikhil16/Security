// middleware/verifyRecaptcha.js
const axios = require("axios");

const verifyRecaptcha = async (req, res, next) => {
    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({
            success: false,
            message: "Please complete the CAPTCHA",
        });
    }

    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken,
                },
            }
        );

        const { success, score } = response.data;

        if (!success || score < 0.5) {
            return res.status(400).json({
                success: false,
                message: "CAPTCHA verification failed. Please try again.",
            });
        }

        next();
    } catch (error) {
        console.error("reCAPTCHA verification error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error verifying CAPTCHA",
        });
    }
};

module.exports = verifyRecaptcha;