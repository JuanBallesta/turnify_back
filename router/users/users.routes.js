const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authClientsController = require("../../controllers/authClients.controller");
const authenticateToken = require("../../middlewares/authenticateToken");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");
const profileController = require("../../controllers/profile.controller");

// --- RUTAS PÚBLICAS (Sin autenticación) ---
Routes.post("/", authClientsController.register);

// --- RUTAS PROTEGIDAS (Requieren token) ---
Routes.get("/search", authenticateToken, userController.searchUsers);
Routes.post("/guest", authenticateToken, userController.createGuestUser);
Routes.get("/by-email", authenticateToken, userController.findUserByEmail);

Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);
Routes.post(
  "/:id/photo",
  authenticateToken,
  uploadMiddleware,
  profileController.uploadClientPhoto
);

Routes.delete("/:id", authenticateToken, userController.deleteUser);

module.exports = Routes;
