const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = db.employees;
const UserType = db.userTypes;
const Business = db.businesses;

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Registra un nuevo empleado y crea su perfil de cliente asociado.
 */
exports.register = async (req, res) => {
  const {
    name,
    lastName,
    username,
    password,
    email,
    phone,
    businessId,
    userTypeId,
    isActive,
  } = req.body;
  const t = await db.sequelize.transaction(); // Iniciar una transacción

  try {
    // Verificación de duplicados en la tabla Employees
    const existingEmployee = await Employee.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email: email }, { username: username }],
      },
    });

    if (existingEmployee) {
      const field = existingEmployee.email === email ? "email" : "username";
      return res.status(409).json({
        ok: false,
        msg: `El ${field} ya está en uso.`,
        errors: [{ path: field, msg: `Este ${field} ya está registrado.` }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Crear el registro de Empleado
    const newEmployee = await Employee.create(
      {
        name,
        lastName,
        username,
        password: hashedPassword,
        email,
        phone,
        businessId,
        userTypeId,
        isActive: isActive ?? true,
      },
      { transaction: t }
    );

    // 2. Crear o encontrar la "contraparte" de Cliente en la tabla Users
    const [clientProfile, created] = await User.findOrCreate({
      where: { email: email },
      defaults: {
        name,
        lastName,
        email,
        phone,
        username: `client_${username}`,
        password: hashedPassword,
      },
      transaction: t,
    });

    await t.commit(); // Confirmar ambos cambios en la base de datos

    res.status(201).json({
      ok: true,
      msg: "Empleado registrado exitosamente (con perfil de cliente asociado).",
      data: newEmployee,
    });
  } catch (error) {
    await t.rollback(); // Revertir la transacción si algo falla
    console.error("Error al registrar empleado:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno al registrar el usuario.",
      error: error.message,
    });
  }
};

/**
 * Inicia sesión para un empleado (admin, superuser, etc.)
 */
exports.login = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const employee = await Employee.findOne({
      where: { userName: userName }, // Corregido para usar la variable correcta
      include: [
        { model: UserType, as: "userType", attributes: ["name"] },
        { model: Business, as: "business", attributes: ["name"] },
      ],
    });

    if (!employee) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, employee.password);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
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
        standardizedRole = "employee";
    }

    const token = jwt.sign(
      {
        id: employee.id,
        userName: employee.username,
        email: employee.email,
        role: standardizedRole,
        businessId: employee.businessId,
        businessName: employee.business?.name,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userResponse = {
      id: employee.id,
      name: employee.name,
      lastName: employee.lastName,
      email: employee.email,
      userName: employee.username,
      phone: employee.phone,
      photo: employee.photo,
      role: standardizedRole,
      businessId: employee.businessId,
      businessName: employee.business?.name,
    };

    res
      .status(200)
      .json({ ok: true, msg: "Login exitoso", token, user: userResponse });
  } catch (error) {
    console.error("Error en login de admin:", error);
    res
      .status(500)
      .json({
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
