const User = require("../models/User");

const createUser = async (userData) => {
    return await User.create(userData);
};

const findUserByEmail = async (email) => {
    return await User.findOne({
        email: email.toLowerCase()
    });
};

const findUserById = async (id) => {
    return await User.findById(id);
};

const updateUser = async (id, updateData) => {
    return await User.findByIdAndUpdate(
        id,
        updateData,
        {
            returnDocument: "after",
            runValidators: true
        }
    );
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser
};