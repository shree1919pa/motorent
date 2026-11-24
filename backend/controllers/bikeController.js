const bikeService =
    require("../services/bikeService");

// ==========================================
// CREATE
// ==========================================

const createBike = async (
    req,
    res
) => {

    try {

        // If image uploaded
        if (req.file) {
            req.body.image = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/bikes/${req.file.filename}`;
        }

        const bike =
            await bikeService.createBike(
                req.body,
                req.user
            );

        res.status(201).json({

            success: true,

            message:
                "Bike added successfully",

            bike
        });

    } catch (error) {

        console.error(
            "Create Bike Error:",
            error
        );

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// GET ALL
// ==========================================

const getAllBikes = async (
    req,
    res
) => {

    try {

        const bikes =
            await bikeService
                .getAllBikes();

        res.status(200).json({

            success: true,

            count:
                bikes.length,

            bikes
        });

    } catch (error) {

        console.error(
            "Get All Bikes Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// GET OWNER BIKES
// ==========================================

const getOwnerBikes = async (
    req,
    res
) => {

    try {

        const bikes =
            await bikeService
                .getOwnerBikes(
                    req.user
                );

        res.status(200).json({

            success: true,

            count:
                bikes.length,

            bikes
        });

    } catch (error) {

        console.error(
            "Get Owner Bikes Error:",
            error
        );

        res.status(403).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// GET BY ID
// ==========================================

const getBikeById = async (
    req,
    res
) => {

    try {

        const bike =
            await bikeService
                .getBikeById(
                    req.params.id
                );

        res.status(200).json({

            success: true,

            bike
        });

    } catch (error) {

        console.error(
            "Get Bike Error:",
            error
        );

        res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// UPDATE
// ==========================================

const updateBike = async (
    req,
    res
) => {

    try {

        // New image uploaded
        if (req.file) {
            req.body.image = req.file.savedPath || req.file.cloudinaryUrl || `/uploads/bikes/${req.file.filename}`;
        }

        const bike =
            await bikeService.updateBike(
                req.params.id,
                req.body,
                req.user
            );

        res.status(200).json({

            success: true,

            message:
                "Bike updated successfully",

            bike
        });

    } catch (error) {

        console.error(
            "Update Bike Error:",
            error
        );

        res.status(403).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// DELETE
// ==========================================

const deleteBike = async (
    req,
    res
) => {

    try {

        await bikeService.deleteBike(
            req.params.id,
            req.user
        );

        res.status(200).json({

            success: true,

            message:
                "Bike deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete Bike Error:",
            error
        );

        res.status(403).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// SEARCH
// ==========================================

const searchBikes = async (
    req,
    res
) => {

    try {

        const bikes =
            await bikeService
                .searchBikes(
                    req.query
                );

        res.status(200).json({

            success: true,

            count:
                bikes.length,

            bikes
        });

    } catch (error) {

        console.error(
            "Search Bikes Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};

// ==========================================
// CHECK AVAILABILITY
// ==========================================

const checkBikeAvailability = async (
    req,
    res
) => {

    try {

        const { startDate, endDate } = req.query;

        const result =
            await bikeService.checkBikeAvailability(
                req.params.id,
                startDate,
                endDate
            );

        res.status(200).json({

            success: true,

            ...result
        });

    } catch (error) {

        console.error(
            "Check Bike Availability Error:",
            error
        );

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};

module.exports = {
    createBike,
    getAllBikes,
    getOwnerBikes,
    getBikeById,
    updateBike,
    deleteBike,
    searchBikes,
    checkBikeAvailability
};