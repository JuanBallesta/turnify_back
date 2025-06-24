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
    username,
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
      username,
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
  // Extraemos el businessId del query de la URL
  const { businessId } = req.query;

  // Construimos la condición de búsqueda
  const whereCondition = {};
  if (businessId) {
    whereCondition.businessId = businessId;
  }

  employee
    .findAll({
      where: whereCondition, // Aplicamos la condición aquí
      include: [
        { model: business, as: "business", attributes: ["id", "name"] },
        { model: userTypes, as: "userType", attributes: ["id", "name"] },
      ],
      // Opcional: ordenar por defecto
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
      // ... manejo de errores
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
  const authenticatedUser = req.user; // Usuario que hace la petición (viene del token)

  try {
    const employeeToUpdate = await employee.findByPk(employeeIdToUpdate);
    if (!employeeToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Empleado no encontrado." });
    }

    // --- LÓGICA DE PERMISOS CORREGIDA Y ROBUSTA ---
    if (authenticatedUser.role === "administrator") {
      // Convertimos ambos IDs a número para una comparación segura.
      // Number(null) es 0, por lo que la comprobación también maneja valores nulos.
      const adminBusinessId = Number(authenticatedUser.businessId);
      const employeeBusinessId = Number(employeeToUpdate.businessId);

      // Añadimos un console.log para depuración en el servidor
      console.log(
        `Verificando permisos: Admin Business ID: ${adminBusinessId}, Empleado Business ID: ${employeeBusinessId}`
      );

      // Si alguno de los IDs no es válido o si no coinciden, denegar.
      if (
        !adminBusinessId ||
        !employeeBusinessId ||
        adminBusinessId !== employeeBusinessId
      ) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permiso para editar empleados de otro negocio.",
        });
      }
    }
    // (Un superuser puede editar a cualquiera, por lo que no necesita esta comprobación)

    const { businessId, userTypeId, isActive } = req.body;
    const updatedFields = {};

    if (businessId !== undefined) updatedFields.businessId = businessId;
    if (userTypeId !== undefined) updatedFields.userTypeId = userTypeId;
    if (isActive !== undefined) updatedFields.isActive = isActive;

    // Un administrador no puede cambiar a un empleado de negocio.
    if (updatedFields.businessId && authenticatedUser.role !== "superuser") {
      // En lugar de dar error, simplemente ignoramos este campo si no es superuser.
      delete updatedFields.businessId;
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
          { model: userTypes, as: "userType", attributes: ["name"] },
          { model: business, as: "business", attributes: ["name"] },
        ],
      }
    );

    res.status(200).json({
      ok: true,
      msg: "Empleado actualizado correctamente.",
      data: updatedEmployeeWithDetails,
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
