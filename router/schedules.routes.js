const router = require("express").Router();
const schedulesController = require("../controllers/schedules.controller");
const authenticateToken = require("../middlewares/authMiddleware");

router.use(authenticateToken);

router.get("/employee/:employeeId", schedulesController.getSchedulesByEmployee);

router.put(
  "/employee/:employeeId",
  schedulesController.updateSchedulesForEmployee
);

module.exports = router;
