const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Client = db.users;

const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  const { name, lastName, userName, password, email, phone } = req.body;

  try {
    const existingClient = await Client.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email: email }, { userName: userName }],
      },
    });

    if (existingClient) {
      if (existingClient.email === email) {
        return res.status(409).json({
          ok: false,
          msg: "Conflicto de datos.",
          errors: [
            { path: "email", msg: "Este correo electrónico ya está en uso." },
          ],
        });
      }
      if (existingClient.userName === userName) {
        return res.status(409).json({
          ok: false,
          msg: "Conflicto de datos.",
          errors: [
            {
              path: "userName",
              msg: "Este nombre de usuario ya está registrado.",
            },
          ],
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newClient = await Client.create({
      name,
      lastName,
      userName,
      password: hashedPassword,
      email,
      phone,
    });

    res.status(201).json({
      ok: true,
      msg: "Cliente registrado correctamente.",
      data: newClient,
    });
  } catch (error) {
    console.error("Error inesperado al registrar cliente:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor al registrar el cliente.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const client = await Client.findOne({ where: { userName } });

    if (!client) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, client.password);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      {
        id: client.id,
        userName: client.userName,
        email: client.email,
        role: "client",
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      ok: true,
      msg: "Login de cliente exitoso",
      token,
      client: {
        id: client.id,
        name: client.name,
        lastName: client.lastName,
        email: client.email,
        userName: client.userName,
        phone: client.phone,
        notes: client.notes,
        photo: client.photo,
        role: "client",
      },
    });
  } catch (error) {
    console.error("Error en login de cliente:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al iniciar sesión",
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

    const client = await Client.findByPk(userId);
    if (!client) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado." });
    }

    const isMatch = await bcrypt.compare(currentPassword, client.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ ok: false, msg: "La contraseña actual es incorrecta." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    client.password = hashedNewPassword;
    await client.save();

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
