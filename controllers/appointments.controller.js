const db = require("../models/index.model");
const appointment = db.appointments;

// Crear una nueva cita
exports.createAppointment = (req, res) => {
  const { startTime, endTime, status, notes } = req.body;

  appointment
    .create({
      startTime,
      endTime,
      status,
      notes,
    })
    .then((newAppointment) => {
      res.status(201).json({
        ok: true,
        msg: "Cita creada.",
        status: 201,
        data: newAppointment,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al crear la cita.",
        status: 500,
        data: error,
      });
    });
};

// Obtener todas las citas
exports.getAllAppointments = (req, res) => {
  appointment
    .findAll()
    .then((appointments) => {
      res.status(200).json({
        ok: true,
        msg: "Lista de citas.",
        status: 200,
        data: appointments,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener las citas.",
        status: 500,
        data: error,
      });
    });
};

// Obtener una cita por ID
exports.getOneAppointment = (req, res) => {
  const id = req.params.id;

  appointment
    .findOne({ where: { id } })
    .then((appointmentData) => {
      if (!appointmentData) {
        return res.status(404).json({
          ok: false,
          msg: "Cita no encontrada.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Cita encontrada.",
        status: 200,
        data: appointmentData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener la cita.",
        status: 500,
        data: error,
      });
    });
};

// Actualizar una cita
exports.updateAppointment = (req, res) => {
  const id = req.params.id;
  const { startTime, endTime, status, notes } = req.body;

  appointment
    .update(
      { startTime, endTime, status, notes },
      { where: { id }, returning: true }
    )
    .then(([affectedCount, affectedRows]) => {
      if (affectedCount === 0) {
        return res.status(404).json({
          ok: false,
          msg: "Cita no encontrada.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Cita actualizada.",
        status: 200,
        data: affectedRows[0],
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al actualizar la cita.",
        status: 500,
        data: error,
      });
    });
};

// Eliminar una cita
exports.deleteAppointment = (req, res) => {
  const id = req.params.id;

  appointment
    .destroy({ where: { id } })
    .then((rowsDeleted) => {
      if (rowsDeleted > 0) {
        res.status(200).json({
          ok: true,
          msg: "Cita eliminada.",
          status: 200,
          data: rowsDeleted,
        });
      } else {
        res.status(404).json({
          ok: false,
          msg: "Cita no encontrada.",
          status: 404,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar la cita.",
        status: 500,
        data: error,
      });
    });
};
