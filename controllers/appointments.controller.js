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
    console.error("ERROR AL CREAR CITA ", error);
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

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 5) || 5;
  const status = req.query.status;
  const search = req.query.search;
  const offset = (page - 1) * limit;
  const dateFilter = req.query.dateFilter;

  try {
    let whereCondition = {};
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
            stats: {},
          },
        });
      }
      whereCondition.employeeId = { [Op.in]: employeeIds };
    }

    if (status && status !== "all") {
      whereCondition.status = status;
    }

    let includeWhere = {};
    if (search) {
      const searchQuery = { [Op.like]: `%${search}%` };
      includeWhere = {
        [Op.or]: [
          { "$offering.name$": searchQuery },
          { "$client.name$": searchQuery },
          { "$client.lastName$": searchQuery },
          { "$employee.name$": searchQuery },
          { "$employee.lastName$": searchQuery },
        ],
      };
    }

    if (dateFilter && dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (dateFilter === "today") {
        whereCondition.startTime = { [Op.between]: [today, endOfToday] };
      } else if (dateFilter === "upcoming") {
        whereCondition.startTime = { [Op.gte]: today };
      } else if (dateFilter === "past") {
        whereCondition.startTime = { [Op.lt]: today };
      }
    }

    const { count, rows } = await appointment.findAndCountAll({
      where: { ...whereCondition, ...includeWhere },
      limit,
      offset,
      include: [
        {
          model: offering,
          as: "offering",
          include: [{ model: business, as: "business" }],
        },
        { model: employee, as: "employee" },
        { model: user, as: "client" },
      ],
      order: [["startTime", "DESC"]],
      distinct: true,
      subQuery: false,
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
    console.error("ERROR EN getMyAppointments", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las citas." });
  }
};

exports.getAppointmentStats = async (req, res) => {
  const { id, role, businessId } = req.user;

  try {
    let whereCondition = {};
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
            total: 0,
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            "no-show": 0,
          },
        });
      }
      whereCondition.employeeId = { [Op.in]: employeeIds };
    }

    const allAppointmentsForStats = await appointment.findAll({
      where: whereCondition,
      attributes: ["status"],
    });

    const stats = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      "no-show": 0,
    };
    for (const apt of allAppointmentsForStats) {
      if (stats.hasOwnProperty(apt.status)) {
        stats[apt.status]++;
      }
      stats.total++;
    }

    res.status(200).json({ ok: true, data: stats });
  } catch (error) {
    console.error("ERROR EN getAppointmentStats", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener las estadísticas." });
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
