const db = require("../models/index.model");
const { Op } = require("sequelize");
const {
  buildAppointmentWhereClause,
} = require("../helpers/appointmentQueryHelper");

const Appointment = db.appointments;
const Offering = db.offerings;
const Employee = db.employees;
const User = db.users;
const Business = db.businesses;

// Verificación para asegurar que los modelos se cargaron correctamente
if (!Appointment || !Offering || !Employee || !User) {
  console.error(
    "ERROR CRÍTICO: Uno o más modelos no se cargaron para el dashboard controller."
  );
}

exports.getDashboardStats = async (req, res) => {
  try {
    const whereCondition = await buildAppointmentWhereClause(
      req.user,
      req.query
    );

    if (whereCondition.id === -1) {
      const emptyStats = {
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        "no-show": 0,
        monthly: 0,
        today: 0,
      };
      return res.status(200).json({
        ok: true,
        data: {
          stats: emptyStats,
          recentAppointments: [],
          upcomingAppointments: [],
          additionalData: {},
        },
      });
    }

    const allAppointments = await Appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: Offering,
          as: "offering",
          include: [{ model: db.businesses, as: "business" }],
        },
        { model: Employee, as: "employee" },
        { model: User, as: "client" },
      ],
      order: [["startTime", "DESC"]],
    });

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
      "no-show": allAppointments.filter((a) => a.status === "no-show").length,
      monthly: allAppointments.filter(
        (a) => new Date(a.startTime) >= startOfMonth
      ).length,
      today: allAppointments.filter(
        (a) =>
          new Date(a.startTime) >= startOfToday &&
          new Date(a.startTime) <
            new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
      ).length,
    };

    let additionalData = {};
    if (req.user.role === "administrator" || req.user.role === "superuser") {
      const offeringWhere =
        req.user.role === "administrator"
          ? { businessId: req.user.businessId }
          : {};
      additionalData.services = await Offering.count({
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
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 5),
        additionalData,
      },
    });
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener los datos del dashboard." });
  }
};
