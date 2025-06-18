const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authenticateToken = require("../../middlewares/authenticateToken");

Routes.post("/", userController.createUser);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);
// Routes.delete("/:id", authenticateToken, userController.deleteUser);

module.exports = Routes;
