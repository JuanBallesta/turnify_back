const Routes = require("express").Router();
const userController = require("../controllers/users.controller");

Routes.post("/", userController.createUser);
Routes.get("/", userController.getAllUsers);
Routes.get("/:id", userController.getOneUser);
Routes.put("/:id", userController.updateUser);
Routes.delete("/:id", userController.deleteUser);

module.exports = Routes;
