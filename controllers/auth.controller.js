// controllers/auth.controller.js

const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = db.employees;
const UserType = db.userTypes;

const JWT_SECRET = process.env.JWT_SECRET; // Usar la clave universal

// Registro (sin cambios funcionales)
exports.register = async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await Employee.create({
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
      msg: "Empleado registrado correctamente",
      data: newEmployee,
    });
  } catch (error) {
    console.error("Error al registrar empleado:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al registrar usuario",
      error: error.message,
    });
  }
};

// Login (CORREGIDO para incluir siempre el rol)
exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const employee = await Employee.findOne({
      where: { userName },
      include: [
        {
          model: UserType,
          as: "userType", // Alias de la asociación
          attributes: ["name"], // Traemos el nombre del rol
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, employee.password);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    if (!employee.userType || !employee.userType.name) {
      return res
        .status(500)
        .json({ ok: false, msg: "Error de configuración: Rol no asignado." });
    }

    // --- LÓGICA DE MAPEO DE ROLES (TRADUCCIÓN) ---
    const roleFromDB = employee.userType.name; // ej: "Super Usuario"
    let standardizedRole;

    switch (roleFromDB) {
      case "Super Usuario":
        standardizedRole = "superuser";
        break;
      case "Administrador":
        standardizedRole = "administrator";
        break;
      case "Empleado":
        standardizedRole = "employee";
        break;
      default:
        // Si hay un rol desconocido, asignamos uno por defecto y lo advertimos
        console.warn(
          `Rol desconocido en la base de datos: "${roleFromDB}". Asignando 'employee'.`
        );
        standardizedRole = "employee";
    }
    // ---------------------------------------------

    // A partir de aquí, usamos 'standardizedRole' para todo
    const token = jwt.sign(
      {
        id: employee.id,
        userName: employee.userName,
        email: employee.email,
        role: standardizedRole,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userResponse = {
      id: employee.id,
      name: employee.name,
      lastName: employee.lastName,
      email: employee.email,
      userName: employee.userName,
      phone: employee.phone,
      photo: employee.photo,
      role: standardizedRole, // Se envía el rol estandarizado al front-end
    };

    res.status(200).json({
      ok: true,
      msg: "Login exitoso",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error detallado en login de admin:", error);
    res
      .status(500)
      .json({
        ok: false,
        msg: "Error interno del servidor",
        error: error.message,
      });
  }
};
