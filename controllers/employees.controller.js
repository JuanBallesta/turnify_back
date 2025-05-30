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

// Obtener todos los empleados con su negocio asociado
exports.getAllEmployees = (req, res) => {
  employee
    .findAll({
      include: [
        {
          model: business,
          attributes: ["id", "name"],
        },
        {
          model: userTypes,
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

// Obtener un empleado por ID con su negocio
exports.getOneEmployee = (req, res) => {
  const id = req.params.id;
  employee
    .findOne({
      where: { id },
      include: [
        {
          model: business,
          attributes: ["id", "name"],
        },
        {
          model: userTypes,
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
  const id = req.params.id;
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
    const employeeData = await employee.findByPk(id);

    if (!employeeData) {
      return res.status(404).json({
        ok: false,
        msg: "Empleado no encontrado.",
        status: 404,
      });
    }

    // Preparamos los campos a actualizar
    let updatedFields = {
      name,
      lastName,
      username,
      email,
      phone,
      businessId,
      userTypeId,
    };

    // Si hay nueva password, la hasheamos antes
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    await employeeData.update(updatedFields);

    res.status(200).json({
      ok: true,
      msg: "Empleado actualizado.",
      status: 200,
      data: employeeData,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el empleado.",
      status: 500,
      data: error.message || error,
    });
  }
};

// Eliminar un empleado
exports.deleteEmployee = (req, res) => {
  const id = req.params.id;
  employee
    .destroy({ where: { id } })
    .then((rowsDeleted) => {
      if (rowsDeleted > 0) {
        res.status(200).json({
          ok: true,
          msg: "Empleado eliminado.",
          status: 200,
          data: rowsDeleted,
        });
      } else {
        res.status(404).json({
          ok: false,
          msg: "Empleado no encontrado.",
          status: 404,
          data: null,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar el empleado.",
        status: 500,
        data: error.message || error,
      });
    });
};
