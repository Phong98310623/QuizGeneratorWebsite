const User = require("../models/user.model");

const createUser = async (data) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    throw new Error("Email already exists");
  }
  return await User.create(data);
};

const getAllUsers = async () => {
  return await User.find();
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser
};