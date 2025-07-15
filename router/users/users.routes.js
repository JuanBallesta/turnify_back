const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authClientsController = require("../../controllers/authClients.controller");
const authenticateToken = require("../../middlewares/authenticateToken");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");

Routes.post("/", authClientsController.register);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);

// Routes.delete("/:id", authenticateToken, userController.deleteUser);

Routes.post(
  "/:id/photo",
  authenticateToken, // Primero autentica
  uploadMiddleware, // Luego procesa el archivo
  userController.uploadProfilePhoto // Finalmente, el controlador
);

module.exports = Routes;
