const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const employee = db.employees;
const business = db.businesses;
const userTypes = db.userTypes;

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
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
  employee
    .findAll({
      include: [
        {
          model: business,
          as: "business", // AÑADIR ALIAS (asumo que se llama 'business')
          attributes: ["id", "name"],
        },
        {
          model: userTypes,
          as: "userType",
          attributes: ["id", "name"],
        },
      ],
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

  if (
    authenticatedUser.role !== "administrator" &&
    authenticatedUser.role !== "superuser" &&
    parseInt(authenticatedUser.id) !== parseInt(employeeIdToUpdate)
  ) {
    return res.status(403).json({
      ok: false,
      msg: "Acceso denegado. No tienes permiso para modificar este perfil.",
    });
  }

  try {
    const employeeToUpdate = await employee.findByPk(employeeIdToUpdate);
    if (!employeeToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Empleado no encontrado." });
    }

    const { name, lastName, phone, notes } = req.body;
    const updatedFields = {
      name: name ?? employeeToUpdate.name,
      lastName: lastName ?? employeeToUpdate.lastName,
      phone: phone ?? employeeToUpdate.phone,
      notes: notes ?? employeeToUpdate.notes,
    };

    await employeeToUpdate.update(updatedFields);

    const updatedEmployeeWithRole = await employee.findByPk(
      employeeIdToUpdate,
      {
        include: [{ model: userTypes, as: "userType", attributes: ["name"] }],
      }
    );

    const userResponse = {
      id: updatedEmployeeWithRole.id,
      name: updatedEmployeeWithRole.name,
      lastName: updatedEmployeeWithRole.lastName,
      userName: updatedEmployeeWithRole.userName,
      email: updatedEmployeeWithRole.email,
      phone: updatedEmployeeWithRole.phone,
      notes: updatedEmployeeWithRole.notes,
      photo: updatedEmployeeWithRole.photo,
      role: updatedEmployeeWithRole.userType.name,
    };

    res.status(200).json({
      ok: true,
      msg: "Empleado actualizado correctamente.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error al actualizar el empleado:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el empleado.",
      error: error.message || error,
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

  Employee.destroy({ where: { id } })
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
