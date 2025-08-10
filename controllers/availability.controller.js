const db = require("../models/index.model");
const { Op } = require("sequelize");

const Offering = db.offerings;
const Employee = db.employees;
const Schedule = db.schedule;
const Appointment = db.appointments;

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
    const interval = 15;

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

function combineDateAndTime(date, timeStr) {
  const [hours, minutes] = timeStr.split(":");
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

exports.getDailySchedule = async (req, res) => {
  const { businessId, date } = req.query;
  if (!businessId || !date)
    return res
      .status(400)
      .json({ ok: false, msg: "Se requiere businessId y date." });

  try {
    const targetDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    const employeesWithSchedules = await Employee.findAll({
      where: { businessId, isActive: true },
      include: [
        {
          model: Schedule,
          as: "schedules",
          where: { dayOfWeek },
          required: false,
        },
      ],
    });

    const employeeIds = employeesWithSchedules.map((e) => e.id);
    if (employeeIds.length === 0)
      return res.status(200).json({ ok: true, data: [] });

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await Appointment.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        status: "scheduled",
        startTime: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: Offering,
          as: "offering",
          attributes: ["name", "durationMinutes"],
        },
      ],
    });

    const scheduleData = employeesWithSchedules.map((employee) => {
      const employeeAppointments = appointments.filter(
        (a) => a.employeeId === employee.id
      );
      return {
        employee: {
          id: employee.id,
          name: `${employee.name} ${employee.lastName}`,
          photo: employee.photo,
        },
        schedules: employee.schedules || [],
        appointments: employeeAppointments,
      };
    });

    res.status(200).json({ ok: true, data: scheduleData });
  } catch (error) {
    console.error("<<<<< ERROR FATAL EN getDailySchedule >>>>>", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener el horario diario." });
  }
};

exports.getScheduleForEmployeesByDate = async (req, res) => {
  const { employeeIds, date } = req.query;
  if (!employeeIds || !date)
    return res.status(400).json({ ok: false, msg: "Faltan parámetros." });

  const ids = employeeIds.split(",").map(Number);
  const targetDate = new Date(`${date}T00:00:00`);
  const dayOfWeek = targetDate.getDay();

  try {
    const [appointments, workSchedules] = await Promise.all([
      Appointment.findAll({
        where: {
          employeeId: { [Op.in]: ids },
          status: "scheduled",
          startTime: {
            [Op.between]: [
              new Date(`${date}T00:00:00Z`),
              new Date(`${date}T23:59:59Z`),
            ],
          },
        },
        include: [{ model: Offering, as: "offering", attributes: ["name"] }],
      }),
      Schedule.findAll({
        where: {
          employeeId: { [Op.in]: ids },
          dayOfWeek: dayOfWeek,
        },
      }),
    ]);
    res.status(200).json({
      ok: true,
      data: {
        appointments: appointments,
        workSchedules: workSchedules,
      },
    });
  } catch (error) {
    console.error("Error en getScheduleForEmployeesByDate:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener horarios." });
  }
};
