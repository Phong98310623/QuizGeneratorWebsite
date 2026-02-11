const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, requireAdmin } = require("../middlewares/auth.middleware");

router.post("/", protect, requireAdmin, userController.createUser);
router.get("/", protect, requireAdmin, userController.getUsers);
router.get("/:id", protect, requireAdmin, userController.getUser);
router.delete("/:id", protect, requireAdmin, userController.deleteUser);
router.post("/:id/status", protect, requireAdmin, userController.updateUserStatus);

module.exports = router;