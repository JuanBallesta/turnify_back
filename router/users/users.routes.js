const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authClientsController = require("../../controllers/authClients.controller");
const authenticateToken = require("../../middlewares/authenticateToken");
const uploadMiddleware = require("../../middlewares/uploadMiddleware");
const profileController = require("../../controllers/profile.controller");

Routes.post("/", authClientsController.register);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);

// Routes.delete("/:id", authenticateToken, userController.deleteUser);

Routes.post(
  "/:id/photo",
  authenticateToken, // 1. PRIMERO, se ejecuta la autenticación y se crea req.user
  uploadMiddleware, // 2. SEGUNDO, multer se ejecuta y AHORA SÍ tiene acceso a req.user
  profileController.uploadClientPhoto // 3. TERCERO, el controlador final
);
module.exports = Routes;
