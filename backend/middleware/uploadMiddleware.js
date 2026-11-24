const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isCloudinaryConfigured, uploadToCloudinary } = require("../config/cloudinary");

// ==========================================
// UPLOAD FOLDERS (FOR LOCAL STORAGE / TEMP UPLOADS)
// ==========================================

const uploadsRootDir = path.join(__dirname, "../uploads");
const bikesUploadDir = path.join(uploadsRootDir, "bikes");
const licensesUploadDir = path.join(uploadsRootDir, "licenses");
const qrCodesUploadDir = path.join(uploadsRootDir, "qrcodes");
const paymentsUploadDir = path.join(uploadsRootDir, "payments");
const profilesUploadDir = path.join(uploadsRootDir, "profiles");

[
    uploadsRootDir,
    bikesUploadDir,
    licensesUploadDir,
    qrCodesUploadDir,
    paymentsUploadDir,
    profilesUploadDir
].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper to determine subfolder based on field name
const getFolderByField = (fieldname) => {
    if (fieldname === "drivingLicenseImage" || fieldname === "license") return "licenses";
    if (fieldname === "qrCode" || fieldname === "ownerQr") return "qrcodes";
    if (fieldname === "paymentScreenshot" || fieldname === "screenshot") return "payments";
    if (fieldname === "profileImage" || fieldname === "avatar") return "profiles";
    return "bikes";
};

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname || "").toLowerCase();

    // Explicitly reject non-image files such as ZIP, EXE, PDF, etc.
    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(
            `Unsupported file type (${ext || file.mimetype || "unknown"}). Only JPG, JPEG, PNG, and WEBP image files are allowed. ZIP, PDF, EXE, and executable files are strictly prohibited.`
        );
        error.statusCode = 400;
        return cb(error, false);
    }

    cb(null, true);
};

// ==========================================
// DYNAMIC STORAGE CONFIG
// ==========================================

const dynamicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = getFolderByField(file.fieldname);
        if (folder === "licenses") cb(null, licensesUploadDir);
        else if (folder === "qrcodes") cb(null, qrCodesUploadDir);
        else if (folder === "payments") cb(null, paymentsUploadDir);
        else if (folder === "profiles") cb(null, profilesUploadDir);
        else cb(null, bikesUploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const folder = getFolderByField(file.fieldname);
        let prefix = "bike";
        if (folder === "licenses") prefix = "license";
        else if (folder === "qrcodes") prefix = "qr";
        else if (folder === "payments") prefix = "payment";
        else if (folder === "profiles") prefix = "profile";

        const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: dynamicStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Handles hybrid Cloudinary / local processing for a single uploaded file.
 * Sets file.savedPath to the Cloudinary URL if available, otherwise local URL path.
 */
const processUploadedFile = async (file) => {
    if (!file) return;

    const folder = getFolderByField(file.fieldname);
    const localUrlPath = `/uploads/${folder}/${file.filename}`;
    file.localPath = localUrlPath;
    file.savedPath = localUrlPath;

    if (isCloudinaryConfigured()) {
        try {
            const result = await uploadToCloudinary(file.path, folder);
            if (result && result.secure_url) {
                file.cloudinaryUrl = result.secure_url;
                file.savedPath = result.secure_url;

                // Clean up local temporary file after successful cloud upload
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupErr) {
                    console.warn("[Upload] Could not delete temp file:", cleanupErr.message);
                }
            }
        } catch (uploadErr) {
            console.warn(
                `[Upload] Cloudinary upload failed for ${file.originalname}, falling back to local storage:`,
                uploadErr.message
            );
        }
    }
};

// ==========================================
// WRAPPER MIDDLEWARES
// ==========================================

const originalSingle = upload.single.bind(upload);
upload.single = (fieldName) => {
    const middleware = originalSingle(fieldName);
    return (req, res, next) => {
        middleware(req, res, async (err) => {
            if (err) return next(err);
            try {
                if (req.file) {
                    await processUploadedFile(req.file);
                }
                next();
            } catch (procErr) {
                next(procErr);
            }
        });
    };
};

const originalFields = upload.fields.bind(upload);
upload.fields = (fields) => {
    const middleware = originalFields(fields);
    return (req, res, next) => {
        middleware(req, res, async (err) => {
            if (err) return next(err);
            try {
                if (req.files) {
                    for (const fieldName of Object.keys(req.files)) {
                        for (const file of req.files[fieldName]) {
                            await processUploadedFile(file);
                        }
                    }
                }
                next();
            } catch (procErr) {
                next(procErr);
            }
        });
    };
};

const originalArray = upload.array.bind(upload);
upload.array = (fieldName, maxCount) => {
    const middleware = originalArray(fieldName, maxCount);
    return (req, res, next) => {
        middleware(req, res, async (err) => {
            if (err) return next(err);
            try {
                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        await processUploadedFile(file);
                    }
                }
                next();
            } catch (procErr) {
                next(procErr);
            }
        });
    };
};

module.exports = upload;
module.exports.upload = upload;
module.exports.processUploadedFile = processUploadedFile;
