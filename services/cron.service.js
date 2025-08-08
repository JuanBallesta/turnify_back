const cron = require("node-cron");
const db = require("../models/index.model");
const { Op } = require("sequelize");
const Appointment = db.appointments;
const Notification = db.notification;
const Offering = db.offerings; // Necesitamos el nombre del servicio

/**
 * Inicia la tarea programada para enviar recordatorios de citas.
 * Se ejecuta todos los días a las 8:00 AM.
 */
const startReminderCronJob = () => {
  // La expresión cron '0 8 * * *' significa:
  // minuto 0, hora 8, todos los días del mes, todos los meses, todos los días de la semana.
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        `[CRON JOB - ${new Date().toLocaleString()}] Ejecutando tarea de recordatorios de citas...`
      );

      try {
        // 1. Calcular el rango de fechas para "mañana"
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        // 2. Buscar todas las citas programadas para mañana
        const upcomingAppointments = await Appointment.findAll({
          where: {
            startTime: { [Op.between]: [startOfTomorrow, endOfTomorrow] },
            status: "scheduled",
          },
          include: [{ model: Offering, as: "offering" }], // Incluimos el servicio para el mensaje
        });

        if (upcomingAppointments.length === 0) {
          console.log("[CRON JOB] No hay citas para mañana. Tarea finalizada.");
          return;
        }

        // 3. Crear una notificación para cada cita encontrada
        const notificationsToCreate = upcomingAppointments.map((apt) => ({
          userId: apt.userId,
          employeeId: apt.employeeId,
          message: `RECORDATORIO: Mañana tienes tu cita para "${
            apt.offering.name
          }" a las ${new Date(apt.startTime).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}.`,
          link: "/appointments",
        }));

        await Notification.bulkCreate(notificationsToCreate);

        console.log(
          `[CRON JOB] Se crearon ${upcomingAppointments.length} notificaciones de recordatorio.`
        );
      } catch (error) {
        console.error(
          "[CRON JOB] Error al generar recordatorios de citas:",
          error
        );
      }
    },
    {
      scheduled: true,
      timezone: "America/Argentina/Buenos_Aires", // <-- ¡MUY IMPORTANTE! Configura tu zona horaria local
    }
  );

  console.log("-> Tarea programada de recordatorios de citas iniciada.");
};

module.exports = { startReminderCronJob };
