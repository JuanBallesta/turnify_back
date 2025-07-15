const Routes = require("express").Router();
const appointmentController = require("../controllers/appointments.controller");
const authenticateToken = require("../middlewares/authenticateToken");

Routes.use(authenticateToken);

Routes.post("/", authenticateToken, appointmentController.createAppointment);
Routes.get("/my", appointmentController.getMyAppointments);
Routes.get("/", authenticateToken, appointmentController.getAllAppointments);
Routes.get("/:id", authenticateToken, appointmentController.getOneAppointment);
Routes.put("/:id", authenticateToken, appointmentController.updateAppointment);
Routes.delete(
  "/:id",
  authenticateToken,
  appointmentController.deleteAppointment
);

module.exports = Routes;
