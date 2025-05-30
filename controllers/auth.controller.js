const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const employees = db.employees;

const JWT_SECRET = "miclavesecretaa";

// Registro de empleado
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
    console.log("Password antes de hashear:", password);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hasheada:", hashedPassword);

    const newEmployee = await employees.create({
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
      error: error,
    });
  }
};

// Login de empleado
exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    // Buscar empleado por userName
    const employee = await employees.findOne({ where: { userName } });

    if (!employee) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    // Comparar password hasheado
    const passwordMatch = await bcrypt.compare(password, employee.password);

    if (!passwordMatch) {
      console.log("user" + userName + "pass" + password);
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: employee.id,
        userName: employee.userName,
        email: employee.email,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      ok: true,
      msg: "Login exitoso",
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        email: employee.email,
        userName: employee.userName,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al iniciar sesión",
      error: error,
    });
  }
};
