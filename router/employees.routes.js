const Routes = require("express").Router();
const employeeController = require("../controllers/employees.controller");
const authenticateToken = require("../middlewares/authenticateToken"); // Apunta al middleware universal

Routes.post("/", employeeController.createEmployee);
Routes.get("/", authenticateToken, employeeController.getAllEmployees);
Routes.get("/:id", authenticateToken, employeeController.getOneEmployee);
Routes.put("/:id", authenticateToken, employeeController.updateEmployee);
Routes.delete("/:id", authenticateToken, employeeController.deleteEmployee);

module.exports = Routes;
