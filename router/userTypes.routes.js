const Routes = require("express").Router();
const userTypeController = require("../controllers/userTypes.controller");

Routes.post("/", userTypeController.createUserType);
Routes.get("/", userTypeController.getAllUserTypes);
Routes.get("/:id", userTypeController.getOneUserType);
Routes.put("/:id", userTypeController.updateUserType);
Routes.delete("/:id", userTypeController.deleteUserType);

module.exports = Routes;
