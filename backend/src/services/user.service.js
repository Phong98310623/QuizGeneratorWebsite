const User = require("../models/user.model");
const { USER_STATUS, USER_ROLES } = require("../shares/constants/userRolesAndStatus.js");

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

//This function changes user status to inactive after 3 days of inactivity
const deactivateInactiveUsers = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await User.updateMany(
    { updatedAt: { $lt: threeDaysAgo }, status: USER_STATUS.ACTIVE },
    { status: USER_STATUS.INACTIVE }
  );
};

//This function promotes user to admin
const promoteToAdmin = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === USER_ROLES.ADMIN) {
    throw new Error("User is already an admin");
  }

  user.role = USER_ROLES.ADMIN;
  await user.save();
  return user;
}

//This function ban user
const banUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new Error("User is already banned");
  }

  user.status = USER_STATUS.BANNED;
  await user.save();
  return user;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  deactivateInactiveUsers,
  promoteToAdmin,
  banUser
};