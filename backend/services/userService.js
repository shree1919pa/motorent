const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

// ==========================================
// REGISTER USER
// ==========================================
const registerUser = async (userData) => {
    const {
        name,
        email,
        mobile,
        password,
        accountType,
        businessName,
        address,
        qrCode,
        drivingLicenseNumber,
        drivingLicenseImage
    } = userData;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
        throw new Error("Name, email, mobile and password are required");
    }

    if (accountType !== "customer" && accountType !== "owner") {
        throw new Error("Invalid account type");
    }

    // Check existing email
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
        throw new Error("Email already registered");
    }

    // FEATURE 2: Owner registration validation with QR code
    if (accountType === "owner") {
        if (!businessName || !businessName.trim()) {
            throw new Error("Business name is required for owner registration");
        }

        if (!address || !address.trim()) {
            throw new Error("Business address is required for owner registration");
        }

        if (!qrCode || !qrCode.trim()) {
            throw new Error("Upload UPI / Bank QR Code is required for owner registration");
        }
    }

    // Client registration validation with driving license
    if (accountType === "customer") {
        if (!drivingLicenseNumber || !drivingLicenseNumber.trim()) {
            throw new Error("Driving licence number is required for client registration");
        }

        if (!drivingLicenseImage || !drivingLicenseImage.trim()) {
            throw new Error("Driving licence image is required for client registration");
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepository.createUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile.trim(),
        password: hashedPassword,
        role: accountType,
        status: "pending",
        businessName: accountType === "owner" ? businessName.trim() : "",
        address: accountType === "owner" ? address.trim() : "",
        qrCode: accountType === "owner" ? qrCode.trim() : "",
        profileImage: "",
        cancellationChargePercentage: 20,
        cancellationTerms: "20% deduction from advance payment upon cancellation.",
        drivingLicenseNumber: accountType === "customer" ? drivingLicenseNumber.trim() : "",
        drivingLicenseImage: accountType === "customer" ? drivingLicenseImage.trim() : ""
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        businessName: user.businessName,
        address: user.address,
        qrCode: user.qrCode,
        profileImage: user.profileImage,
        cancellationChargePercentage: user.cancellationChargePercentage,
        cancellationTerms: user.cancellationTerms,
        drivingLicenseNumber: user.drivingLicenseNumber,
        drivingLicenseImage: user.drivingLicenseImage
    };
};

// ==========================================
// LOGIN USER
// ==========================================
const loginUser = async (email, password) => {
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    // Account status verification
    const userStatus = user.status || "pending";

    if (userStatus === "blocked" || user.isBlocked) {
        if (user.role === "owner") {
            throw new Error("Your owner account has been blocked by the administrator.");
        }
        throw new Error("Your account has been blocked by the administrator.");
    }

    if (userStatus === "pending") {
        throw new Error("Your account is waiting for Admin approval.");
    }

    if (userStatus === "rejected") {
        throw new Error("Your account registration has been rejected by Admin.");
    }

    if (userStatus === "suspended") {
        throw new Error("Your account has been suspended by Admin.");
    }

    if (userStatus !== "active") {
        throw new Error("Your account is not active. Please contact support.");
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
            status: user.status,
            email: user.email
        },
        process.env.JWT_SECRET || "motorent_secret_change_later",
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            status: user.status,
            businessName: user.businessName,
            address: user.address,
            qrCode: user.qrCode || "",
            profileImage: user.profileImage || "",
            cancellationChargePercentage: user.cancellationChargePercentage ?? 20,
            cancellationTerms: user.cancellationTerms || "20% deduction from advance payment upon cancellation.",
            drivingLicenseNumber: user.drivingLicenseNumber,
            drivingLicenseImage: user.drivingLicenseImage
        }
    };
};

// ==========================================
// GET USER BY ID
// ==========================================
const getUserById = async (id) => {
    const user = await userRepository.findUserById(id);

    if (!user) {
        throw new Error("User not found");
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        businessName: user.businessName,
        address: user.address,
        qrCode: user.qrCode || "",
        profileImage: user.profileImage || "",
        cancellationChargePercentage: user.cancellationChargePercentage ?? 20,
        cancellationTerms: user.cancellationTerms || "20% deduction from advance payment upon cancellation.",
        drivingLicenseNumber: user.drivingLicenseNumber,
        drivingLicenseImage: user.drivingLicenseImage,
        createdAt: user.createdAt
    };
};

// ==========================================
// UPDATE USER PROFILE (FEATURE 8)
// ==========================================
const updateProfile = async (userId, updateData) => {
    const user = await userRepository.findUserById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const allowedUpdates = {};

    if (updateData.name && updateData.name.trim()) {
        allowedUpdates.name = updateData.name.trim();
    }

    if (updateData.mobile && updateData.mobile.trim()) {
        allowedUpdates.mobile = updateData.mobile.trim();
    }

    if (updateData.email && updateData.email.trim() && updateData.email.toLowerCase() !== user.email.toLowerCase()) {
        const emailExists = await userRepository.findUserByEmail(updateData.email.trim());
        if (emailExists && emailExists._id.toString() !== userId.toString()) {
            throw new Error("Email is already taken by another account");
        }
        allowedUpdates.email = updateData.email.toLowerCase().trim();
    }

    if (user.role === "owner") {
        if (updateData.businessName !== undefined) {
            allowedUpdates.businessName = updateData.businessName.trim();
        }
        if (updateData.address !== undefined) {
            allowedUpdates.address = updateData.address.trim();
        }
        if (updateData.qrCode !== undefined && updateData.qrCode.trim()) {
            allowedUpdates.qrCode = updateData.qrCode.trim();
        }
        if (updateData.profileImage !== undefined && updateData.profileImage.trim()) {
            allowedUpdates.profileImage = updateData.profileImage.trim();
        }
        if (updateData.cancellationChargePercentage !== undefined && updateData.cancellationChargePercentage !== "") {
            const charge = Number(updateData.cancellationChargePercentage);
            if (isNaN(charge) || charge < 0 || charge > 100) {
                throw new Error("Cancellation charge percentage must be between 0 and 100");
            }
            allowedUpdates.cancellationChargePercentage = charge;
        }
        if (updateData.cancellationTerms !== undefined) {
            allowedUpdates.cancellationTerms = updateData.cancellationTerms.trim();
        }
    } else {
        if (updateData.address !== undefined) {
            allowedUpdates.address = updateData.address.trim();
        }
        if (updateData.drivingLicenseNumber !== undefined) {
            allowedUpdates.drivingLicenseNumber = updateData.drivingLicenseNumber.trim();
        }
        if (updateData.drivingLicenseImage !== undefined && updateData.drivingLicenseImage.trim()) {
            allowedUpdates.drivingLicenseImage = updateData.drivingLicenseImage.trim();
        }
    }

    // FEATURE 8: Password change with current password verification
    const newPassword = updateData.newPassword || updateData.password;
    if (newPassword && newPassword.trim()) {
        if (!updateData.currentPassword) {
            throw new Error("Current password is required to change password");
        }

        const isMatch = await bcrypt.compare(updateData.currentPassword, user.password);
        if (!isMatch) {
            throw new Error("Current password does not match");
        }

        if (newPassword.trim().length < 6) {
            throw new Error("New password must be at least 6 characters long");
        }

        allowedUpdates.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await userRepository.updateUser(userId, allowedUpdates);

    return {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        status: updatedUser.status,
        businessName: updatedUser.businessName,
        address: updatedUser.address,
        qrCode: updatedUser.qrCode || "",
        profileImage: updatedUser.profileImage || "",
        cancellationChargePercentage: updatedUser.cancellationChargePercentage ?? 20,
        cancellationTerms: updatedUser.cancellationTerms || "20% deduction from advance payment upon cancellation.",
        drivingLicenseNumber: updatedUser.drivingLicenseNumber,
        drivingLicenseImage: updatedUser.drivingLicenseImage,
        createdAt: updatedUser.createdAt
    };
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateProfile
};
