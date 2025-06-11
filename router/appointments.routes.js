const Routes = require("express").Router();
const appointmentController = require("../controllers/appointments.controller");
const authenticateToken = require("../middlewares/authMiddleware");

Routes.post("/", authenticateToken, appointmentController.createAppointment);
Routes.get("/", appointmentController.getAllAppointments);
Routes.get("/:id", appointmentController.getOneAppointment);
Routes.put("/:id", appointmentController.updateAppointment);
Routes.delete("/:id", appointmentController.deleteAppointment);

module.exports = Routes;
