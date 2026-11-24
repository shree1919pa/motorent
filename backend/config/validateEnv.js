/**
 * Environment Variable Validation Module for MotoRent Backend
 * Validates required variables before server boot to fail fast with clear instructions.
 */

const validateEnv = () => {
    const isProd = process.env.NODE_ENV === "production";
    const errors = [];
    const warnings = [];

    // 1. Database URI validation
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        errors.push(
            "Missing MONGODB_URI (or MONGO_URI). Set this to your MongoDB Atlas connection string in your .env file or Render Environment Settings."
        );
    } else if (mongoUri.includes("USERNAME:PASSWORD") || mongoUri.includes("<username>")) {
        errors.push(
            "MONGODB_URI contains placeholder credentials ('USERNAME:PASSWORD' or '<username>'). Replace with your actual MongoDB Atlas database user credentials."
        );
    }

    // 2. JWT Secret validation
    if (!process.env.JWT_SECRET) {
        if (isProd) {
            errors.push("Missing JWT_SECRET in production. Set a strong, random secret string.");
        } else {
            warnings.push("JWT_SECRET is not set. Using temporary development fallback (unsafe for production).");
        }
    } else if (isProd && process.env.JWT_SECRET === "motorent_secret_change_later") {
        warnings.push("JWT_SECRET is still set to the default placeholder. Please update it to a secure random string on Render.");
    }

    // 3. Cloudinary check (optional, but recommended for production ephemeral storage)
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

    if (hasCloudName || hasApiKey || hasApiSecret) {
        if (!hasCloudName || !hasApiKey || !hasApiSecret) {
            warnings.push(
                "Partial Cloudinary configuration detected. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are all provided for cloud image storage."
            );
        }
    } else if (isProd) {
        warnings.push(
            "Cloudinary credentials not detected in production. Uploaded images will be stored on Render's local ephemeral filesystem and may be reset upon redeployment. Consider configuring Cloudinary for persistent storage."
        );
    }

    // Output warnings
    warnings.forEach((w) => console.warn(`[CONFIG WARNING] ${w}`));

    // Throw if fatal configuration error
    if (errors.length > 0) {
        console.error("\n========================================================");
        console.error("FATAL CONFIGURATION ERROR(S) PREVENTING SERVER START:");
        errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
        console.error("========================================================\n");
        throw new Error(`Environment validation failed with ${errors.length} error(s).`);
    }

    return {
        mongoUri,
        isProd,
        port: process.env.PORT || 5000,
        hasCloudinary: hasCloudName && hasApiKey && hasApiSecret
    };
};

module.exports = validateEnv;
module.exports.validateEnv = validateEnv;
