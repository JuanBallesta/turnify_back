const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authenticateToken = require("../../middlewares/authenticateToken"); // Apunta al middleware universal

Routes.post("/", userController.createUser);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser); // Ruta protegida
Routes.delete("/:id", authenticateToken, userController.deleteUser); // También debería estar protegida

module.exports = Routes;
