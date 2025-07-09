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
  try {
    const whereCondition = {};
    if (req.user.role === "administrator") {
      whereCondition.businessId = req.user.businessId;
    }
    if (req.user.role === "superuser" && req.query.businessId) {
      whereCondition.businessId = req.query.businessId;
    }

    const offerings = await Offering.findAll({
      where: whereCondition,
      include: [{ model: Business, as: "business", attributes: ["name"] }],
    });
    res
      .status(200)
      .json({ ok: true, msg: "Lista de servicios obtenida.", data: offerings });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los servicios.",
      error: error.message,
    });
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
          attributes: ["id", "name", "lastName"],
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
