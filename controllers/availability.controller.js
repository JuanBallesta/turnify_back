const db = require("../models/index.model");
const { Op } = require("sequelize");

// Asegúrate de que los nombres de los modelos coincidan con tu index.model.js
const Offering = db.offerings;
const Employee = db.employees;
const Schedule = db.schedule;
const Appointment = db.appointments;

/**
 * Calcula los horarios disponibles para un servicio en una fecha específica,
 * opcionalmente filtrado por un empleado.
 */
exports.getAvailability = async (req, res) => {
  const { serviceId, date, employeeId } = req.query;

  if (!serviceId || !date) {
    return res
      .status(400)
      .json({ ok: false, msg: "Se requiere serviceId y date." });
  }

  try {
    const service = await Offering.findByPk(serviceId);
    if (!service) {
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    }

    const serviceDuration = service.durationMinutes;

    let assignedEmployees = await service.getEmployees({
      attributes: ["id", "name", "lastName"],
    });

    // Si se especifica un employeeId, filtramos la lista de empleados a solo ese.
    if (employeeId && employeeId !== "any") {
      assignedEmployees = assignedEmployees.filter(
        (emp) => emp.id.toString() === employeeId
      );
    }

    if (assignedEmployees.length === 0) {
      return res.status(200).json({ ok: true, data: [] });
    }

    const employeeIds = assignedEmployees.map((emp) => emp.id);
    const targetDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    const [workSchedules, existingAppointments] = await Promise.all([
      Schedule.findAll({
        where: { employeeId: { [Op.in]: employeeIds }, dayOfWeek: dayOfWeek },
      }),
      Appointment.findAll({
        where: {
          employeeId: { [Op.in]: employeeIds },
          status: "scheduled",
          startTime: {
            [Op.gte]: new Date(`${date}T00:00:00.000Z`),
            [Op.lt]: new Date(`${date}T23:59:59.999Z`),
          },
        },
      }),
    ]);

    const availableSlots = [];
    const interval = 15; // Revisar disponibilidad cada 15 minutos

    for (const employee of assignedEmployees) {
      const employeeWorkHours = workSchedules.filter(
        (s) => s.employeeId === employee.id
      );
      const employeeAppointments = existingAppointments.filter(
        (a) => a.employeeId === employee.id
      );

      for (const workShift of employeeWorkHours) {
        let potentialSlotStart = combineDateAndTime(
          targetDate,
          workShift.startTime
        );
        const shiftEnd = combineDateAndTime(targetDate, workShift.endTime);

        while (
          new Date(potentialSlotStart.getTime() + serviceDuration * 60000) <=
          shiftEnd
        ) {
          const potentialSlotEnd = new Date(
            potentialSlotStart.getTime() + serviceDuration * 60000
          );

          const isOverlapping = employeeAppointments.some((appointment) => {
            const appointmentStart = new Date(appointment.startTime);
            const appointmentEnd = new Date(appointment.endTime);
            return (
              potentialSlotStart < appointmentEnd &&
              potentialSlotEnd > appointmentStart
            );
          });

          if (!isOverlapping) {
            availableSlots.push({
              time: formatTime(potentialSlotStart),
              employeeId: employee.id,
              employeeName: `${employee.name} ${employee.lastName}`,
            });
          }
          potentialSlotStart = new Date(
            potentialSlotStart.getTime() + interval * 60000
          );
        }
      }
    }

    // Si no se eligió un empleado específico, eliminamos duplicados de horarios
    const finalSlots =
      employeeId && employeeId !== "any"
        ? availableSlots
        : [
            ...new Map(
              availableSlots.map((item) => [item["time"], item])
            ).values(),
          ];

    finalSlots.sort((a, b) => a.time.localeCompare(b.time));

    res.status(200).json({ ok: true, data: finalSlots });
  } catch (error) {
    console.error("Error en getAvailability:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al calcular la disponibilidad." });
  }
};

// --- Funciones de ayuda ---
function combineDateAndTime(date, timeStr) {
  const [hours, minutes] = timeStr.split(":");
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}
