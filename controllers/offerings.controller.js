const db = require("../models/index.model");
const Offering = db.offerings;
const Business = db.businesses;
const Employee = db.employees;

// Crear un nuevo offering
exports.createOffering = async (req, res) => {
  const {
    name,
    description,
    price,
    durationMinutes,
    category,
    image,
    businessId,
    isActive,
  } = req.body;

  if (req.user.role !== "superuser" && req.user.role !== "administrator") {
    return res.status(403).json({ ok: false, msg: "Acceso denegado." });
  }
  if (
    req.user.role === "administrator" &&
    Number(req.user.businessId) !== Number(businessId)
  ) {
    return res
      .status(403)
      .json({ ok: false, msg: "No puedes crear servicios para otro negocio." });
  }

  try {
    const newOffering = await Offering.create({
      name,
      description,
      price,
      durationMinutes,
      category,
      image,
      businessId,
      isActive: isActive ?? true,
    });
    res.status(201).json({
      ok: true,
      msg: "Servicio creado exitosamente.",
      data: newOffering,
    });
  } catch (error) {
    console.error("ERROR AL CREAR SERVICIO (Offering):", error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear el servicio.",
      error: error.message,
    });
  }
};

// Obtener todos los offerings (filtrado por rol)
exports.getAllOfferings = async (req, res) => {
  const { role, businessId } = req.user;
  const { context } = req.query; // 'booking' o 'management'

  try {
    let whereCondition = {};

    if (context === "booking") {
      // Para la página de reserva, traemos TODOS los servicios ACTIVOS
      whereCondition.isActive = true;
    } else {
      // context === 'management' o no definido
      // Para la página de gestión, aplicamos filtros por rol
      if (role === "administrator") {
        whereCondition.businessId = businessId;
        // No filtramos por isActive para que el admin pueda ver y activar/desactivar
      }
      // Si es superuser, no aplicamos filtro para que vea todo
    }

    const offerings = await Offering.findAll({
      where: whereCondition,
      include: [{ model: Business, as: "business", attributes: ["name"] }],
      order: [["name", "ASC"]],
    });

    res.status(200).json({ ok: true, data: offerings });
  } catch (error) {
    console.error("Error en getAllOfferings:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener los servicios." });
  }
};

// Obtener un offering por ID
exports.getOneOffering = async (req, res) => {
  try {
    const id = req.params.id;
    const offeringData = await Offering.findOne({ where: { id } });

    if (!offeringData) {
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    }
    res
      .status(200)
      .json({ ok: true, msg: "Servicio encontrado.", data: offeringData });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al obtener el servicio.",
      error: error.message,
    });
  }
};

// Actualizar un offering
exports.updateOffering = async (req, res) => {
  try {
    const id = req.params.id;
    const offeringToUpdate = await Offering.findByPk(id);
    if (!offeringToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    }
    if (
      req.user.role === "administrator" &&
      Number(req.user.businessId) !== Number(offeringToUpdate.businessId)
    ) {
      return res.status(403).json({
        ok: false,
        msg: "No puedes editar servicios de otro negocio.",
      });
    }
    await offeringToUpdate.update(req.body);
    res
      .status(200)
      .json({ ok: true, msg: "Servicio actualizado.", data: offeringToUpdate });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el servicio.",
      error: error.message,
    });
  }
};

// Eliminar un offering
exports.deleteOffering = async (req, res) => {
  try {
    const id = req.params.id;
    const offeringToDelete = await Offering.findByPk(id);
    if (!offeringToDelete) {
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    }
    if (
      req.user.role === "administrator" &&
      Number(req.user.businessId) !== Number(offeringToDelete.businessId)
    ) {
      return res.status(403).json({
        ok: false,
        msg: "No puedes eliminar servicios de otro negocio.",
      });
    }
    await offeringToDelete.destroy();
    res.status(200).json({ ok: true, msg: "Servicio eliminado." });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar el servicio.",
      error: error.message,
    });
  }
};

exports.getOfferingWithAssignedEmployees = async (req, res) => {
  try {
    const offering = await Offering.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: "employees",
          attributes: ["id", "name", "lastName", "photo"],
          through: { attributes: [] },
        },
      ],
    });
    if (!offering)
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    res.status(200).json({ ok: true, data: offering });
  } catch (error) {
    console.error("Error en getOfferingWithAssignedEmployees:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener las asignaciones.",
      error: error.message,
    });
  }
};

exports.updateAssignedEmployees = async (req, res) => {
  const offeringId = req.params.id;
  const { employeeIds } = req.body;

  if (!Array.isArray(employeeIds)) {
    return res
      .status(400)
      .json({ ok: false, msg: "Se esperaba un array de IDs de empleados." });
  }

  try {
    const offering = await Offering.findByPk(offeringId);
    if (!offering)
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });

    await offering.setEmployees(employeeIds);
    res
      .status(200)
      .json({ ok: true, msg: "Asignaciones actualizadas correctamente." });
  } catch (error) {
    console.error("Error en updateAssignedEmployees:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar las asignaciones.",
      error: error.message,
    });
  }
};

exports.uploadOfferingPhoto = async (req, res) => {
  const offeringId = req.params.id;

  if (!req.file) {
    return res
      .status(400)
      .json({ ok: false, msg: "No se ha subido ningún archivo." });
  }

  try {
    const offeringToUpdate = await Offering.findByPk(offeringId);
    if (!offeringToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Servicio no encontrado." });
    }

    // Lógica de permisos: solo admins del negocio o superuser
    if (
      req.user.role === "administrator" &&
      Number(req.user.businessId) !== Number(offeringToUpdate.businessId)
    ) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para modificar este servicio.",
      });
    }

    // Construimos la URL pública (sin /api)
    const imageUrl = `/uploads/${req.file.filename}`;

    offeringToUpdate.image = imageUrl;
    await offeringToUpdate.save();

    res.status(200).json({
      ok: true,
      msg: "Imagen del servicio actualizada.",
      data: { imageUrl },
    });
  } catch (error) {
    console.error("Error al guardar la imagen del servicio:", error);
    res.status(500).json({ ok: false, msg: "Error al guardar la imagen." });
  }
};
