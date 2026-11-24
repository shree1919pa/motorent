const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Fetch fresh user from DB to verify current status in real-time
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists"
            });
        }

        if (user.status === "pending") {
            return res.status(403).json({
                success: false,
                message: "Your account is waiting for Admin approval."
            });
        }

        if (user.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended by Admin."
            });
        }

        if (user.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "Your account registration has been rejected by Admin."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Account is not active."
            });
        }

        req.user = {
            id: user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;