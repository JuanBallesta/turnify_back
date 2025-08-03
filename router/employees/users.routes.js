const Routes = require("express").Router();
const userController = require("../../controllers/users.controller");
const authenticateToken = require("../../middlewares/authAdminMiddleware");

Routes.post("/", authenticateToken, userController.createUser);
Routes.get("/", authenticateToken, userController.getAllUsers);
Routes.get("/:id", authenticateToken, userController.getOneUser);
Routes.put("/:id", authenticateToken, userController.updateUser);
Routes.delete("/:id", authenticateToken, userController.deleteUser);
Routes.get("/by-email", authenticateToken, userController.findUserByEmail);

module.exports = Routes;
