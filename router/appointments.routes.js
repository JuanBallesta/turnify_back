const Routes = require("express").Router();
const appointmentController = require("../controllers/appointments.controller");

Routes.post("/", appointmentController.createAppointment);
Routes.get("/", appointmentController.getAllAppointments);
Routes.get("/:id", appointmentController.getOneAppointment);
Routes.put("/:id", appointmentController.updateAppointment);
Routes.delete("/:id", appointmentController.deleteAppointment);

module.exports = Routes;
