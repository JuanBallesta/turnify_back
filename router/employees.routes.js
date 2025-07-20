const Routes = require("express").Router();
const employeeController = require("../controllers/employees.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const profileController = require("../controllers/profile.controller");

Routes.post("/", employeeController.createEmployee);
Routes.get("/", authenticateToken, employeeController.getAllEmployees);
Routes.get("/:id", authenticateToken, employeeController.getOneEmployee);
Routes.put("/:id", authenticateToken, employeeController.updateEmployee);
Routes.delete("/:id", authenticateToken, employeeController.deleteEmployee);
Routes.post(
  "/:id/photo",
  authenticateToken,
  uploadMiddleware,
  profileController.uploadEmployeePhoto
);

module.exports = Routes;
