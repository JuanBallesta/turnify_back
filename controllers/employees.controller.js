const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const employee = db.employees;
const business = db.businesses;
const userTypes = db.userTypes;

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  console.log("Backend recibió para registrar:", req.body);
  const {
    name,
    lastName,
    userName,
    password,
    email,
    phone,
    businessId,
    userTypeId,
  } = req.body;

  try {
    // Hashear password antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await employee.create({
      name,
      lastName,
      userName,
      password: hashedPassword,
      email,
      phone,
      businessId,
      userTypeId,
    });

    res.status(201).json({
      ok: true,
      msg: "Empleado creado.",
      status: 201,
      data: newEmployee,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al crear el empleado.",
      status: 500,
      data: error.message || error,
    });
  }
};

// Obtener todos los empleados con su negocio y rol asociados
exports.getAllEmployees = (req, res) => {
  const { businessId } = req.query;

  const whereCondition = {};
  if (businessId) {
    whereCondition.businessId = businessId;
  }

  employee
    .findAll({
      where: whereCondition,
      include: [
        { model: business, as: "business", attributes: ["id", "name"] },
        { model: userTypes, as: "userType", attributes: ["id", "name"] },
      ],
      order: [["name", "ASC"]],
    })
    .then((employees) => {
      res.status(200).json({
        ok: true,
        msg: "Lista de empleados.",
        status: 200,
        data: employees,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener los empleados.",
        status: 500,
        data: error.message || error,
      });
    });
};

// Obtener un empleado por ID con su negocio y rol
exports.getOneEmployee = (req, res) => {
  const id = req.params.id;
  employee
    .findOne({
      where: { id },
      include: [
        {
          model: business,
          as: "business",
          attributes: ["id", "name"],
        },
        {
          model: userTypes,
          as: "userType",
          attributes: ["id", "name"],
        },
      ],
    })
    .then((employeeData) => {
      if (!employeeData) {
        return res.status(404).json({
          ok: false,
          msg: "Empleado no encontrado.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Empleado encontrado.",
        status: 200,
        data: employeeData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener el empleado.",
        status: 500,
        data: error.message || error,
      });
    });
};

// Actualizar un empleado
exports.updateEmployee = async (req, res) => {
  const employeeIdToUpdate = req.params.id;
  const authenticatedUser = req.user;

  try {
    const employeeToUpdate = await employee.findByPk(employeeIdToUpdate);
    if (!employeeToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Empleado no encontrado." });
    }

    // Lógica de permisos (ya está correcta y es robusta)
    const isAdmin = authenticatedUser.role === "administrator";
    const isSuperUser = authenticatedUser.role === "superuser";
    const isSelf =
      parseInt(authenticatedUser.id) === parseInt(employeeIdToUpdate);
    let hasPermission = isSelf || isSuperUser;
    if (isAdmin && !isSelf) {
      const adminBusinessId = Number(authenticatedUser.businessId);
      const employeeBusinessId = Number(employeeToUpdate.businessId);
      if (
        adminBusinessId &&
        employeeBusinessId &&
        adminBusinessId === employeeBusinessId
      ) {
        hasPermission = true;
      }
    }
    if (!hasPermission) {
      return res.status(403).json({ ok: false, msg: "Acceso denegado." });
    }

    // --- LÓGICA DE ACTUALIZACIÓN FLEXIBLE (LA SOLUCIÓN) ---
    // Leemos TODOS los posibles campos del body
    const { name, lastName, phone, notes, businessId, userTypeId, isActive } =
      req.body;
    const updatedFields = {};

    // Comprobamos cada campo y lo añadimos si fue proporcionado en la petición
    if (name !== undefined) updatedFields.name = name;
    if (lastName !== undefined) updatedFields.lastName = lastName;
    if (phone !== undefined) updatedFields.phone = phone;
    if (notes !== undefined) updatedFields.notes = notes;
    if (businessId !== undefined) updatedFields.businessId = businessId;
    if (userTypeId !== undefined) updatedFields.userTypeId = userTypeId;
    if (isActive !== undefined) updatedFields.isActive = isActive;

    // Reglas de negocio sobre los campos a actualizar
    if (updatedFields.businessId && !isSuperUser) {
      delete updatedFields.businessId;
    }
    if (updatedFields.userTypeId) {
      const targetRole = await userTypes.findByPk(updatedFields.userTypeId);
      if (
        targetRole &&
        targetRole.name.toLowerCase() === "super usuario" &&
        !isSuperUser
      ) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permiso para asignar el rol de Super Usuario.",
        });
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        ok: false,
        msg: "No se proporcionaron datos para actualizar.",
      });
    }

    await employeeToUpdate.update(updatedFields);

    const updatedEmployeeWithDetails = await employee.findByPk(
      employeeIdToUpdate,
      {
        include: [
          { model: userTypes, as: "userType" },
          { model: business, as: "business" },
        ],
      }
    );

    res.status(200).json({
      ok: true,
      msg: "Empleado actualizado correctamente.",
      user: updatedEmployeeWithDetails, // Devolvemos en 'user' para consistencia
    });
  } catch (error) {
    console.error("Error al actualizar el empleado:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el empleado.",
      error: error.message,
    });
  }
};

// Eliminar un empleado
exports.deleteEmployee = (req, res) => {
  const id = req.params.id;
  const authenticatedUser = req.user;

  if (
    authenticatedUser.role !== "administrator" &&
    authenticatedUser.role !== "superuser"
  ) {
    return res.status(403).json({ ok: false, msg: "Acceso denegado." });
  }

  employee
    .destroy({ where: { id } })
    .then((rowsDeleted) => {
      if (rowsDeleted > 0) {
        res
          .status(200)
          .json({ ok: true, msg: "Empleado eliminado.", data: rowsDeleted });
      } else {
        res.status(404).json({ ok: false, msg: "Empleado no encontrado." });
      }
    })
    .catch((error) =>
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar el empleado.",
        error: error.message || error,
      })
    );
};
