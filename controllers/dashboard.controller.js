const db = require("../models/index.model");
const { Op } = require("sequelize");
const appointments = db.appointments;
const offerings = db.offerings;
const employee = db.employees;
const users = db.users;

exports.getDashboardStats = async (req, res) => {
  const { id, role, businessId } = req.user;

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
    whereCondition.employeeId = { [Op.in]: employeeIds };
  }
  try {
    const allAppointments = await appointments.findAll({
      where: whereCondition,
      include: [
        { model: offerings, as: "offering" },
        { model: employee, as: "employee" },
        { model: users, as: "client", attributes: ["name", "lastName"] },
      ],
      order: [["startTime", "DESC"]],
    });

    // Calcular estadísticas basadas en las citas
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const stats = {
      total: allAppointments.length,
      scheduled: allAppointments.filter((a) => a.status === "scheduled").length,
      completed: allAppointments.filter((a) => a.status === "completed").length,
      cancelled: allAppointments.filter((a) => a.status === "cancelled").length,
      monthly: allAppointments.filter(
        (a) => new Date(a.startTime) >= startOfMonth
      ).length,
      today: allAppointments.filter(
        (a) => new Date(a.startTime) >= startOfToday
      ).length,
    };

    let additionalData = {};
    if (role === "client" || role === "administrator" || role === "superuser") {
      const offeringWhere = role === "administrator" ? { businessId } : {};
      additionalData.services = await offerings.count({
        where: { ...offeringWhere, isActive: true },
      });
    }

    res.status(200).json({
      ok: true,
      data: {
        stats,
        recentAppointments: allAppointments.slice(0, 10),
        upcomingAppointments: allAppointments
          .filter(
            (a) => a.status === "scheduled" && new Date(a.startTime) >= now
          )
          .slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener los datos del dashboard." });
  }
};
