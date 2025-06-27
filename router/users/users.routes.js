const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authClientsController = require("../../controllers/authClients.controller");
const authenticateToken = require("../../middlewares/authenticateToken");

Routes.post("/", authClientsController.register);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);
// Routes.delete("/:id", authenticateToken, userController.deleteUser);

module.exports = Routes;
