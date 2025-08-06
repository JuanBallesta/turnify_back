const Routes = require("express").Router();
const schedulesController = require("../controllers/schedules.controller");
const authenticateToken = require("../middlewares/authMiddleware");

Routes.use(authenticateToken);

Routes.get("/employee/:employeeId", schedulesController.getSchedulesByEmployee);

Routes.put(
  "/employee/:employeeId",
  schedulesController.updateSchedulesForEmployee
);

module.exports = Routes;
