const db = require("../models/index.model");
const { Op } = require("sequelize");
const {
  buildAppointmentWhereClause,
} = require("../helpers/appointmentQueryHelper");

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
  const { userId, employeeId, offeringId, startTime, endTime, notes, status } =
    req.body;

  const authenticatedUser = req.user;

  if (
    authenticatedUser.role === "client" &&
    parseInt(authenticatedUser.id) !== parseInt(userId)
  ) {
    return res.status(403).json({
      ok: false,
      msg: "No puedes reservar citas para otros usuarios.",
    });
  }

  if (!userId || !employeeId || !offeringId || !startTime || !endTime) {
    return res.status(400).json({ ok: false, msg: "Faltan datos requeridos." });
  }

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
      msg: "Error interno al crear la cita.",
      error: error.message,
    });
  }
};

// Obtiene las citas relevantes para el usuario logueado
exports.getMyAppointments = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { search } = req.query;

  try {
    const whereCondition = await buildAppointmentWhereClause(
      req.user,
      req.query
    );

    if (whereCondition.id === -1) {
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

    let includeWhere = {};
    if (search) {
      const searchTerm = `%${search}%`;
      includeWhere[Op.or] = [
        { "$offering.name$": { [Op.like]: searchTerm } },
        { "$client.name$": { [Op.like]: searchTerm } },
        { "$client.lastName$": { [Op.like]: searchTerm } },
        { "$employee.name$": { [Op.like]: searchTerm } },
        { "$employee.lastName$": { [Op.like]: searchTerm } },
      ];
    }

    const { count, rows } = await appointment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: offering,
          as: "offering",
          include: [{ model: business, as: "business" }],
          where: includeWhere[Op.or]
            ? {
                [Op.or]: includeWhere[Op.or].filter((c) =>
                  Object.keys(c)[0].startsWith("$offering")
                ),
              }
            : undefined,
          required: search ? true : false,
        },
        {
          model: employee,
          as: "employee",
          where: includeWhere[Op.or]
            ? {
                [Op.or]: includeWhere[Op.or].filter((c) =>
                  Object.keys(c)[0].startsWith("$employee")
                ),
              }
            : undefined,
          required: search ? true : false,
        },
        {
          model: user,
          as: "client",
          where: includeWhere[Op.or]
            ? {
                [Op.or]: includeWhere[Op.or].filter((c) =>
                  Object.keys(c)[0].startsWith("$client")
                ),
              }
            : undefined,
          required: search ? true : false,
        },
      ],
      limit: limit,
      offset: offset,
      order: [["startTime", "DESC"]],
      distinct: true,
    });

    res.status(200).json({
      ok: true,
      data: {
        totalItems: count.length,
        totalPages: Math.ceil(count.length / limit),
        currentPage: page,
        appointments: rows,
      },
    });
  } catch (error) {
    console.error("Error en getMyAppointments:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las citas." });
  }
};

exports.getAppointmentStats = async (req, res) => {
  const { id, role, businessId, email } = req.user;
  const { view } = req.query; // <-- 1. Leemos el nuevo parámetro 'view'

  try {
    let whereCondition = {};

    // --- 2. APLICAMOS LA MISMA LÓGICA DE FILTRADO QUE EN getMyAppointments ---
    if (role === "administrator" && view === "personal") {
      const adminAsClient = await user.findOne({ where: { email } });
      if (adminAsClient) {
        whereCondition.userId = adminAsClient.id;
      } else {
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
    } else if (role === "administrator") {
      const employeesInBusiness = await employee.findAll({
        where: { businessId },
        attributes: ["id"],
      });
      const employeeIds = employeesInBusiness.map((e) => e.id);
      if (employeeIds.length > 0) {
        whereCondition.employeeId = { [Op.in]: employeeIds };
      } else {
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
    } else if (role === "client") {
      whereCondition.userId = id;
    } else if (role === "employee") {
      whereCondition.employeeId = id;
    }

    const stats = await appointment.findAll({
      where: whereCondition,
      attributes: [
        "status",
        [db.sequelize.fn("COUNT", db.sequelize.col("status")), "count"],
      ],
      group: ["status"],
    });

    const formattedStats = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      "no-show": 0,
    };
    stats.forEach((item) => {
      const status = item.get("status");
      const count = parseInt(item.get("count"), 10);
      if (formattedStats.hasOwnProperty(status)) {
        formattedStats[status] = count;
      }
      formattedStats.total += count;
    });

    res.status(200).json({ ok: true, data: formattedStats });
  } catch (error) {
    console.error("Error en getAppointmentStats:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener las estadísticas." });
  }
};

// Actualizar una cita
exports.updateAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  const { status, cancellationReason } = req.body;

  try {
    // Usamos 'appointmentToUpdate' para la instancia, evitando conflictos
    const appointmentToUpdate = await appointment.findByPk(appointmentId);
    if (!appointmentToUpdate) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada." });
    }

    const now = new Date();
    const appointmentTime = new Date(appointmentToUpdate.startTime);

    // Reglas de negocio
    if (status === "completed" || status === "no-show") {
      if (now < appointmentTime) {
        return res
          .status(403)
          .json({
            ok: false,
            msg: `No se puede marcar como '${status}' una cita que aún no ha comenzado.`,
          });
      }
    }

    if (status === "cancelled") {
      const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
      if (hoursUntilAppointment <= 24) {
        return res
          .status(403)
          .json({
            ok: false,
            msg: "No se puede cancelar la cita con menos de 24 horas.",
          });
      }
    }

    // Construimos el objeto de actualización
    const updateData = {};
    if (status) updateData.status = status;
    if (cancellationReason) updateData.cancellationReason = cancellationReason;
    if (status === "cancelled")
      updateData.cancelledBy = req.user.role === "client" ? "client" : "staff";

    await appointmentToUpdate.update(updateData);

    res.status(200).json({
      ok: true,
      msg: "Cita actualizada correctamente.",
      data: appointmentToUpdate,
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL ACTUALIZAR CITA >>>>>", error);
    res
      .status(500)
      .json({
        ok: false,
        msg: "Error al actualizar la cita.",
        error: error.message,
      });
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
