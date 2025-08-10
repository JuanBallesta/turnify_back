const db = require("../models/index.model");
const schedule = db.schedule;
const employee = db.employees;

if (!schedule || !employee) {
  console.error(
    "ERROR CRÍTICO: Los modelos Schedule o Employee no se cargaron correctamente."
  );
}

// Obtener los horarios de un empleado específico
exports.getSchedulesByEmployee = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const foundEmployee = await employee.findByPk(employeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ ok: false, msg: "Empleado no encontrado." });
    }

    const schedules = await schedule.findAll({
      where: { employeeId: employeeId },
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    res.status(200).json({ ok: true, data: schedules });
  } catch (error) {
    console.error("Error en getSchedulesByEmployee:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los horarios.",
      error: error.message,
    });
  }
};

// Actualizar los horarios de un empleado
exports.updateSchedulesForEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const newSchedules = req.body;

  if (
    req.user.role !== "superuser" &&
    req.user.role !== "administrator" &&
    Number(req.user.id) !== Number(employeeId)
  ) {
    return res.status(403).json({ ok: false, msg: "Acceso denegado." });
  }

  if (!Array.isArray(newSchedules)) {
    return res.status(400).json({
      ok: false,
      msg: "El cuerpo de la petición debe ser un array de horarios.",
    });
  }

  const t = await db.sequelize.transaction();
  try {
    await schedule.destroy({ where: { employeeId }, transaction: t });

    if (newSchedules.length > 0) {
      const schedulesToCreate = newSchedules.map((schedule) => ({
        ...schedule,
        employeeId: employeeId,
      }));
      await schedule.bulkCreate(schedulesToCreate, { transaction: t });
    }

    await t.commit();
    res
      .status(200)
      .json({ ok: true, msg: "Horario actualizado correctamente." });
  } catch (error) {
    await t.rollback();
    console.error("Error en updateSchedulesForEmployee:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el horario.",
      error: error.message,
    });
  }
};
