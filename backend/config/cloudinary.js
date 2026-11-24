const cloudinary = require("cloudinary").v2;

/**
 * Checks whether Cloudinary credentials are provided in environment variables.
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

// Configure Cloudinary when credentials exist
if (isCloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
        api_key: process.env.CLOUDINARY_API_KEY.trim(),
        api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
        secure: true
    });
}

/**
 * Uploads a local file to Cloudinary with folder organization.
 * @param {string} filePath - Absolute path to local file
 * @param {string} folder - Subfolder name (e.g. 'bikes', 'licenses', 'qrcodes', 'payments', 'profiles')
 * @returns {Promise<object|null>} Cloudinary upload result object or null if not configured
 */
const uploadToCloudinary = async (filePath, folder = "general") => {
    if (!isCloudinaryConfigured()) {
        return null;
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `motorent/${folder}`,
            resource_type: "auto",
            transformation: [{ quality: "auto", fetch_format: "auto" }]
        });
        return result;
    } catch (error) {
        console.error(`[Cloudinary] Upload failed for ${filePath}:`, error.message);
        throw error;
    }
};

module.exports = {
    cloudinary,
    isCloudinaryConfigured,
    uploadToCloudinary
};
