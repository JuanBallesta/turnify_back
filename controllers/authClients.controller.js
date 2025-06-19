const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Client = db.users;

const JWT_SECRET = process.env.JWT_SECRET;

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

    // Generar token JWT con la clave universal, incluyendo el rol 'client'
    const token = jwt.sign(
      {
        id: client.id,
        userName: client.userName,
        email: client.email,
        role: "client", // Añadimos el rol manualmente
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
        role: "client", // También lo añadimos a la respuesta
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

    // CAMBIO AQUÍ: Usa 'Employee' en lugar de 'User'
    const user = await Client.findByPk(userId);
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
