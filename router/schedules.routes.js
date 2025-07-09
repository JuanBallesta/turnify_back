const router = require("express").Router();
const schedulesController = require("../controllers/schedules.controller");
const authenticateToken = require("../middlewares/authMiddleware");

router.use(authenticateToken);

// GET /api/schedules/employee/:employeeId - Obtener horarios de un empleado
router.get("/employee/:employeeId", schedulesController.getSchedulesByEmployee);

// PUT /api/schedules/employee/:employeeId - Actualizar/sobrescribir horarios
router.put(
  "/employee/:employeeId",
  schedulesController.updateSchedulesForEmployee
);

module.exports = router;
