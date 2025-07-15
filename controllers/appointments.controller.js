const db = require("../models/index.model");
const appointment = db.appointments;
const employee = db.employees;
const offering = db.offerings;
const user = db.users;

// Crear una nueva cita
exports.createAppointment = async (req, res) => {
  const userIdFromToken = req.user.id;
  const { employeeId, offeringId, startTime, endTime, status, notes } =
    req.body;

  if (!employeeId || !offeringId || !startTime || !endTime) {
    return res.status(400).json({ ok: false, msg: "Faltan datos requeridos." });
  }

  try {
    const newAppointment = await appointment.create({
      userId: userIdFromToken,
      employeeId,
      offeringId,
      startTime,
      endTime,
      status: status || "scheduled",
      notes,
    });

    res.status(201).json({
      ok: true,
      msg: "Cita creada exitosamente.",
      data: newAppointment,
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL CREAR CITA >>>>>", error);
    res.status(500).json({ ok: false, msg: "Error interno al crear la cita." });
  }
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

exports.getMyAppointments = async (req, res) => {
  const { id, role, businessId } = req.user;
  const whereCondition = {};

  try {
    if (role === "userId") {
      whereCondition.clientId = id;
    } else if (role === "employee") {
      whereCondition.employeeId = id;
    } else if (role === "administrator") {
      const employeesInBusiness = await employee.findAll({
        where: { businessId: businessId },
        attributes: ["id"],
      });
      const employeeIds = employeesInBusiness.map((e) => e.id);
      whereCondition.employeeId = { [db.Sequelize.Op.in]: employeeIds };
    }

    const appointments = await appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: offering,
          as: "offering",
          attributes: ["name", "description"],
        },
        { model: employee, as: "employee", attributes: ["name", "lastName"] },
        { model: user, as: "client", attributes: ["name", "lastName"] },
      ],
      order: [["startTime", "DESC"]],
    });

    res.status(200).json({ ok: true, data: appointments });
  } catch (error) {
    console.error("Error en getMy-appointments:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las citas." });
  }
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
