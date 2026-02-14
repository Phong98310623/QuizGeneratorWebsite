const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, requireAdmin } = require("../middlewares/auth.middleware");

router.get("/me/history", protect, userController.getMyHistory);
router.get("/me/favorites", protect, userController.getMyFavoritesAndCollections);
router.post("/me/favorites/toggle", protect, userController.toggleFavorite);
router.post("/me/saved-collections", protect, userController.createSavedCollection);
router.post("/me/saved-collections/:nameid/add", protect, userController.addQuestionToCollection);
router.post("/me/saved-collections/:nameid/remove", protect, userController.removeQuestionFromCollection);
router.post("/", protect, requireAdmin, userController.createUser);
router.get("/", protect, requireAdmin, userController.getUsers);
router.get("/:id", protect, requireAdmin, userController.getUser);
router.delete("/:id", protect, requireAdmin, userController.deleteUser);
router.post("/:id/status", protect, requireAdmin, userController.updateUserStatus);

module.exports = router;