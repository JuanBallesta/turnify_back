const db = require("../models/index.model");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const employee = db.employees;
const business = db.businesses;
const userTypes = db.userTypes;

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  console.log("BACKEND: Datos recibidos para crear empleado:", req.body);
  const {
    name,
    lastName,
    userName,
    password,
    email,
    phone,
    businessId,
    userTypeId,
    isActive,
  } = req.body;

  try {
    if (!userName) {
      return res.status(400).json({
        ok: false,
        msg: "El campo 'userName' es requerido.",
      });
    }

    // Lógica para verificar duplicados.
    const existingEmployee = await employee.findOne({
      where: {
        // Buscamos tanto por email como por el userName recibido.
        [Op.or]: [{ email: email }, { userName: userName }],
      },
    });

    if (existingEmployee) {
      if (existingEmployee.email.toLowerCase() === email.toLowerCase()) {
        return res
          .status(409)
          .json({ ok: false, msg: "El correo electrónico ya está en uso." });
      }
      if (existingEmployee.userName.toLowerCase() === userName.toLowerCase()) {
        return res
          .status(409)
          .json({ ok: false, msg: "El nombre de usuario ya está en uso." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await employee.create({
      name,
      lastName,
      userName: userName,
      password: hashedPassword,
      email,
      phone,
      businessId,
      userTypeId,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      ok: true,
      msg: "Empleado creado exitosamente.",
      data: newEmployee,
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL CREAR EMPLEADO >>>>>", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno al registrar el usuario.",
      error: error.message || error,
    });
  }
};

// Obtener todos los empleados con su negocio y rol asociados
exports.getAllEmployees = async (req, res) => {
  const {
    businessId,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
    search,
  } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    let whereCondition = {};
    if (businessId) {
      whereCondition.businessId = businessId;
    }

    // --- LÓGICA DE BÚSQUEDA CORREGIDA Y SIMPLIFICADA ---
    if (search) {
      const searchTerm = `%${search}%`;
      // Aplicamos el filtro de búsqueda a las columnas de la tabla 'Employees'
      whereCondition[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { lastName: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { userName: { [Op.like]: searchTerm } },
      ];
    }

    const { count, rows } = await employee.findAndCountAll({
      where: whereCondition, // Ahora la condición 'where' es correcta
      limit: parseInt(limit, 10),
      offset: offset,
      include: [
        { model: business, as: "business" },
        { model: userTypes, as: "userType" },
      ],
      order: [[sortBy || "lastName", sortOrder || "ASC"]],
      distinct: true,
    });

    res.status(200).json({
      ok: true,
      data: {
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        employees: rows,
      },
    });
  } catch (error) {
    console.error("Error en getAllEmployees:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener los empleados." });
  }
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
  const employeeId = req.params.id;
  const dataToUpdate = req.body;
  const authenticatedUser = req.user;

  console.log(
    `[UPDATE EMPLOYEE] Petición para actualizar empleado ID: ${employeeId}`
  );
  console.log("[UPDATE EMPLOYEE] Datos recibidos:", dataToUpdate);

  try {
    const employeeToUpdate = await employee.findByPk(employeeId);
    if (!employeeToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Empleado no encontrado." });
    }

    const isSelf = parseInt(authenticatedUser.id) === parseInt(employeeId);
    const isAdmin = authenticatedUser.role === "administrator";
    const isSuperUser = authenticatedUser.role === "superuser";

    // Un admin solo puede editar empleados de su propio negocio
    if (
      isAdmin &&
      !isSuperUser &&
      parseInt(authenticatedUser.businessId) !==
        parseInt(employeeToUpdate.businessId)
    ) {
      return res.status(403).json({
        ok: false,
        msg: "No puedes editar empleados de otro negocio.",
      });
    }

    if (isSelf) {
      delete dataToUpdate.businessId;
      delete dataToUpdate.userTypeId;
      delete dataToUpdate.isActive;
      delete dataToUpdate.role;
    }

    // Nadie puede cambiar el email o el userName desde este endpoint para evitar conflictos
    delete dataToUpdate.email;
    delete dataToUpdate.userName;
    // La contraseña se cambia en otro endpoint
    delete dataToUpdate.password;

    console.log(
      "[UPDATE EMPLOYEE] Datos limpios para actualizar:",
      dataToUpdate
    );

    await employeeToUpdate.update(dataToUpdate);

    const updatedEmployee = await employee.findByPk(employeeId, {
      include: [
        { model: business, as: "business", attributes: ["name"] },
        { model: userTypes, as: "userType", attributes: ["name"] },
      ],
    });

    const userResponse = {
      ...updatedEmployee.toJSON(),
      role: authenticatedUser.role,
      businessName: updatedEmployee.business?.name,
    };

    console.log("[UPDATE EMPLOYEE] Actualización exitosa.");
    res.status(200).json({
      ok: true,
      msg: "Perfil actualizado correctamente.",
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "<<<<< ERROR FATAL AL ACTUALIZAR PERFIL DE EMPLEADO >>>>>",
      error
    );
    res
      .status(500)
      .json({ ok: false, msg: "Error interno al actualizar el perfil." });
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
