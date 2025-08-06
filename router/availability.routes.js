const Routes = require("express").Router();
const availabilityController = require("../controllers/availability.controller");
const authenticateToken = require("../middlewares/authMiddleware");

Routes.get("/", authenticateToken, availabilityController.getAvailability);
Routes.get(
  "/daily",
  authenticateToken,
  availabilityController.getDailySchedule
);
Routes.get(
  "/by-employees",
  availabilityController.getScheduleForEmployeesByDate
);

module.exports = Routes;
