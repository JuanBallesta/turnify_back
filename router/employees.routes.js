const Routes = require("express").Router();
const employeeController = require("../controllers/employees.controller");

Routes.post("/", employeeController.createEmployee);
Routes.get("/", employeeController.getAllEmployees);
Routes.get("/:id", employeeController.getOneEmployee);
Routes.put("/:id", employeeController.updateEmployee);
Routes.delete("/:id", employeeController.deleteEmployee);

module.exports = Routes;
