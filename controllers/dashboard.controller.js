const db = require("../models/index.model");
const { Op } = require("sequelize");

// Usamos los nombres estandarizados (PascalCase) de los modelos
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
  const { id, role, businessId } = req.user;

  console.log(
    `[DASHBOARD] Petición recibida del usuario ID: ${id}, Rol: ${role}, BusinessID: ${businessId}`
  );

  try {
    let whereCondition = {};

    if (role === "client") {
      whereCondition.userId = id;
    } else if (role === "employee") {
      whereCondition.employeeId = id;
    } else if (role === "administrator") {
      const employeesInBusiness = await Employee.findAll({
        where: { businessId: businessId },
        attributes: ["id"],
      });
      const employeeIds = employeesInBusiness.map((e) => e.id);

      if (employeeIds.length === 0) {
        return res.status(200).json({
          ok: true,
          data: {
            stats: {
              total: 0,
              scheduled: 0,
              completed: 0,
              cancelled: 0,
              monthly: 0,
              today: 0,
            },
            recentAppointments: [],
            upcomingAppointments: [],
            additionalData: { services: 0 },
          },
        });
      }
      whereCondition.employeeId = { [Op.in]: employeeIds };
    }

    console.log("[DASHBOARD] Condición 'where' para citas:", whereCondition);

    const allAppointments = await Appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: Offering,
          as: "offering",
          attributes: ["name", "description"],
          include: [
            {
              model: Business,
              as: "business",
              attributes: ["name", "address"],
            },
          ],
        },
        { model: Employee, as: "employee", attributes: ["name", "lastName"] },
        { model: User, as: "client", attributes: ["name", "lastName"] },
      ],
      order: [["startTime", "DESC"]],
    });

    console.log(`[DASHBOARD] Se encontraron ${allAppointments.length} citas.`);

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

    // 5. Obtenemos datos adicionales según el rol
    let additionalData = {};
    if (role === "client" || role === "administrator" || role === "superuser") {
      const offeringWhere = role === "administrator" ? { businessId } : {};
      additionalData.services = await Offering.count({
        where: { ...offeringWhere, isActive: true },
      });
    }

    // 6. Devolvemos el paquete completo de datos al frontend
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
    console.error("<<<<< ERROR FATAL EN getDashboardStats >>>>>", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener los datos del dashboard." });
  }
};
