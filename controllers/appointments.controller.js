const db = require("../models/index.model");
const { Op } = require("sequelize");

// --- ESTANDARIZACIÓN: Usamos PascalCase para todos los modelos ---
const appointment = db.appointments;
const offering = db.offerings;
const employee = db.employees;
const user = db.users;
const business = db.businesses;

if (!appointment || !offering || !employee || !user || !business) {
  console.error(
    "ERROR CRÍTICO: Uno o más modelos no se cargaron para el appointments.controller."
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
    console.error("<<<<< ERROR FATAL AL CREAR CITA >>>>>", error);
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

  try {
    let whereCondition = {};
    if (role === "client") whereCondition.userId = id;
    else if (role === "employee") whereCondition.employeeId = id;
    else if (role === "administrator") {
      const employeesInBusiness = await employee.findAll({
        where: { businessId },
        attributes: ["id"],
      });
      const employeeIds = employeesInBusiness.map((e) => e.id);
      if (employeeIds.length === 0)
        return res.status(200).json({ ok: true, data: [] });
      whereCondition.employeeId = { [Op.in]: employeeIds };
    }

    const appointments = await appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: offering,
          as: "offering",
          include: [
            {
              model: business,
              as: "business",
              attributes: ["name", "address"],
            },
          ],
        },
        { model: employee, as: "employee", attributes: ["name", "lastName"] },
        { model: user, as: "client", attributes: ["name", "lastName"] },
      ],
      order: [["startTime", "DESC"]],
    });

    res.status(200).json({ ok: true, data: appointments });
  } catch (error) {
    console.error("<<<<< ERROR FATAL EN getMyAppointments >>>>>", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las citas." });
  }
};

// Actualizar una cita
exports.updateAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  const dataToUpdate = req.body; // Esto será { status: 'cancelled' }

  try {
    // 1. Buscamos la instancia de la cita a actualizar
    const appointmentToUpdate = await appointment.findByPk(appointmentId);
    if (!appointmentToUpdate) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada." });
    }

    // 2. Aquí podrías añadir lógica de permisos si es necesario
    // Ej: if (req.user.id !== appointmentToUpdate.userId && req.user.role !== 'administrator') { ... }

    // 3. Actualizamos la instancia con los nuevos datos
    await appointmentToUpdate.update(dataToUpdate);

    // 4. Devolvemos la respuesta de éxito
    res.status(200).json({
      ok: true,
      msg: "Cita actualizada correctamente.",
      data: appointmentToUpdate, // Devolvemos la cita actualizada
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL ACTUALIZAR CITA >>>>>", error);
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
