const db = require("../models/index.model");
const { Op } = require("sequelize");

const appointment = db.appointments;
const offering = db.offerings;
const employee = db.employees;
const user = db.users;
const business = db.businesses;

if (!appointment || !offering || !employee || !user || !business) {
  console.error(
    "ERROR CRÍTICO: Uno o más modelos no se cargaron para appointments.controller."
  );
}

// Crear una nueva cita
exports.createAppointment = async (req, res) => {
  const { employeeId, offeringId, startTime, endTime, notes, status } =
    req.body;
  const userId = req.user.id;
  try {
    const newAppointment = await appointment.create({
      userId,
      employeeId,
      offeringId,
      startTime,
      endTime,
      notes,
      status: status || "scheduled",
    });
    res.status(201).json({
      ok: true,
      msg: "Cita creada exitosamente.",
      data: newAppointment,
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL CREAR CITA >>>>>", error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear la cita.",
      error: error.message,
    });
  }
};

// Obtiene las citas relevantes para el usuario logueado
exports.getMyAppointments = async (req, res) => {
  const { id, role, businessId } = req.user;

  // 1. Leer parámetros de paginación de la URL
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const offset = (page - 1) * limit;

  try {
    let whereCondition = {};

    // 2. Construir la condición de filtro por rol
    if (role === "client") {
      whereCondition.userId = id;
    } else if (role === "employee") {
      whereCondition.employeeId = id;
    } else if (role === "administrator") {
      const employeesInBusiness = await employee.findAll({
        where: { businessId },
        attributes: ["id"],
      });
      const employeeIds = employeesInBusiness.map((e) => e.id);
      if (employeeIds.length === 0) {
        return res.status(200).json({
          ok: true,
          data: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            appointments: [],
          },
        });
      }
      whereCondition.employeeId = { [Op.in]: employeeIds };
    }

    const { count, rows } = await appointment.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      include: [
        {
          model: offering,
          as: "offering",
          include: [
            {
              model: business,
              as: "business",
              attributes: ["name", "address"],
            },
          ],
        },
        {
          model: employee,
          as: "employee",
          attributes: ["name", "lastName", "photo"],
        },
        {
          model: user,
          as: "client",
          attributes: ["name", "lastName", "photo"],
        },
      ],
      order: [["startTime", "DESC"]],
      distinct: true,
    });

    res.status(200).json({
      ok: true,
      data: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        appointments: rows,
      },
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL EN getMyAppointments >>>>>", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las citas." });
  }
};

// Actualizar una cita
exports.updateAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  try {
    const appointmentToUpdate = await appointment.findByPk(appointmentId);
    if (!appointmentToUpdate) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada." });
    }

    const now = new Date();
    const appointmentStartTime = new Date(appointmentToUpdate.startTime);
    const hasStarted = now >= appointmentStartTime;

    if (status === "cancelled") {
      if (hasStarted)
        return res.status(403).json({
          ok: false,
          msg: "No se puede cancelar una cita que ya ha comenzado.",
        });
    }

    if (status === "completed" || status === "no-show") {
      if (req.user.role === "client")
        return res.status(403).json({
          ok: false,
          msg: "Un cliente no puede realizar esta acción.",
        });
      if (!hasStarted)
        return res.status(403).json({
          ok: false,
          msg: "Esta acción solo se puede realizar después de la hora de inicio.",
        });
    }

    await appointmentToUpdate.update({ status });
    res.status(200).json({
      ok: true,
      msg: "Estado de la cita actualizado.",
      data: appointmentToUpdate,
    });
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    res.status(500).json({ ok: false, msg: "Error al actualizar la cita." });
  }
};

// Eliminar una cita
exports.deleteAppointment = async (req, res) => {
  const id = req.params.id;
  try {
    const rowsDeleted = await appointment.destroy({ where: { id } });
    if (rowsDeleted > 0) {
      res.status(200).json({ ok: true, msg: "Cita eliminada." });
    } else {
      res.status(404).json({ ok: false, msg: "Cita no encontrada." });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar la cita.",
      error: error.message,
    });
  }
};
