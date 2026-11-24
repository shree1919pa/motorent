const userService = require("../services/userService");

// ==========================================
// REGISTER
// ==========================================
const register = async (req, res) => {
    try {
        const registrationData = { ...req.body };

        // Handle uploaded files (drivingLicenseImage and qrCode)
        if (req.files) {
            if (req.files.drivingLicenseImage && req.files.drivingLicenseImage[0]) {
                const f = req.files.drivingLicenseImage[0];
                registrationData.drivingLicenseImage = f.savedPath || f.cloudinaryUrl || `/uploads/licenses/${f.filename}`;
            }
            if (req.files.qrCode && req.files.qrCode[0]) {
                const f = req.files.qrCode[0];
                registrationData.qrCode = f.savedPath || f.cloudinaryUrl || `/uploads/qrcodes/${f.filename}`;
            }
        } else if (req.file) {
            if (req.file.fieldname === "qrCode" || req.file.fieldname === "ownerQr") {
                registrationData.qrCode = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/qrcodes/${req.file.filename}`;
            } else {
                registrationData.drivingLicenseImage = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/licenses/${req.file.filename}`;
            }
        }

        const user = await userService.registerUser(registrationData);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const data = await userService.loginUser(email, password);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: data.token,
            user: data.user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// LOGOUT (FEATURE 1)
// ==========================================
const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// PROFILE
// ==========================================
const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// UPDATE PROFILE (FEATURE 8)
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Handle uploaded files
        if (req.files) {
            if (req.files.drivingLicenseImage && req.files.drivingLicenseImage[0]) {
                const f = req.files.drivingLicenseImage[0];
                updateData.drivingLicenseImage = f.savedPath || f.cloudinaryUrl || `/uploads/licenses/${f.filename}`;
            }
            if (req.files.qrCode && req.files.qrCode[0]) {
                const f = req.files.qrCode[0];
                updateData.qrCode = f.savedPath || f.cloudinaryUrl || `/uploads/qrcodes/${f.filename}`;
            }
            if (req.files.profileImage && req.files.profileImage[0]) {
                const f = req.files.profileImage[0];
                updateData.profileImage = f.savedPath || f.cloudinaryUrl || `/uploads/profiles/${f.filename}`;
            }
        } else if (req.file) {
            if (req.file.fieldname === "qrCode") {
                updateData.qrCode = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/qrcodes/${req.file.filename}`;
            } else if (req.file.fieldname === "profileImage") {
                updateData.profileImage = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/profiles/${req.file.filename}`;
            } else {
                updateData.drivingLicenseImage = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/licenses/${req.file.filename}`;
            }
        }

        const user = await userService.updateProfile(req.user.id, updateData);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile
};
