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
  // 1. Leemos el userId DEL CUERPO de la petición.
  const { userId, employeeId, offeringId, startTime, endTime, notes, status } =
    req.body;

  // 2. Obtenemos el usuario autenticado para la lógica de permisos.
  const authenticatedUser = req.user;

  // --- LÓGICA DE PERMISOS ---
  // Un cliente solo puede agendar para sí mismo.
  // 'userId' es para quién es la cita, 'authenticatedUser.id' es quién está logueado.
  if (
    authenticatedUser.role === "client" &&
    parseInt(authenticatedUser.id) !== parseInt(userId)
  ) {
    return res.status(403).json({
      ok: false,
      msg: "No puedes reservar citas para otros usuarios.",
    });
  }
  // (Los administradores y empleados no entran en esta restricción)

  // Verificación de datos
  if (!userId || !employeeId || !offeringId || !startTime || !endTime) {
    return res.status(400).json({ ok: false, msg: "Faltan datos requeridos." });
  }

  try {
    const newAppointment = await appointment.create({
      userId, // <-- 3. Usamos el userId del body
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
  const { id, role, businessId } = req.user;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Convertimos 'limit' a número
  const offset = (page - 1) * limit; // Ahora la operación es entre números

  const { status, search, dateFilter, view } = req.query;
  try {
    let whereCondition = {};

    // Lógica de filtrado por rol y vista (sin cambios)
    if (role === "administrator" && view === "personal") {
      const adminAsClient = await user.findOne({
        where: { email: req.user.email },
      });
      if (adminAsClient) {
        whereCondition.userId = adminAsClient.id;
      } else {
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
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            appointments: [],
          },
        });
      }
    } else if (role === "client") {
      whereCondition.userId = id;
    } else if (role === "employee") {
      whereCondition.employeeId = id;
    }

    if (status && status !== "all") {
      whereCondition.status = status;
    }

    if (dateFilter && dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (dateFilter === "today")
        whereCondition.startTime = { [Op.between]: [today, endOfToday] };
      else if (dateFilter === "upcoming")
        whereCondition.startTime = { [Op.gte]: today };
      else if (dateFilter === "past")
        whereCondition.startTime = { [Op.lt]: today };
    }

    // --- ¡AQUÍ ESTÁ LA LÓGICA QUE FALTABA! ---
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

    const { count, rows } = await appointment.findAndCountAll({
      where: { ...whereCondition, ...includeWhere }, // Ahora 'includeWhere' existe
      limit: limit,
      offset: offset,
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
        return res
          .status(200)
          .json({
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
        return res
          .status(200)
          .json({
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
