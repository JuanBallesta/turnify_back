const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = db.employees;
const UserType = db.userTypes;

const JWT_SECRET = process.env.JWT_SECRET;

// Registro
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

// Login
exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const employee = await Employee.findOne({
      where: { userName },
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["name"],
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

    const roleFromDB = employee.userType.name;
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
        console.warn(
          `Rol desconocido en la base de datos: "${roleFromDB}". Asignando 'employee'.`
        );
        standardizedRole = "employee";
    }

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
      role: standardizedRole,
    };

    res.status(200).json({
      ok: true,
      msg: "Login exitoso",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error detallado en login de admin:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ ok: false, msg: "Todos los campos son requeridos." });
    }

    // CAMBIO AQUÍ: Usa 'Employee' en lugar de 'User'
    const user = await Employee.findByPk(userId);
    if (!user) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ ok: false, msg: "La contraseña actual es incorrecta." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res
      .status(200)
      .json({ ok: true, msg: "Contraseña actualizada exitosamente." });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({
      ok: false,
      msg: "Error en el servidor al cambiar la contraseña.",
    });
  }
};
