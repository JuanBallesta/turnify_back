const db = require("../models/index.model");
const User = db.users;
const Employee = db.employees;

const uploadProfilePhoto = async (req, res, Model) => {
  const userId = req.params.id;
  const authenticatedUser = req.user;

  console.log(
    `[UPLOAD PHOTO] Iniciando subida para ${Model.name}, ID: ${userId}`
  );

  if (parseInt(userId) !== parseInt(authenticatedUser.id)) {
    console.log(
      `[UPLOAD PHOTO] DENEGADO: Usuario ${authenticatedUser.id} intentó cambiar foto de ${userId}`
    );
    return res
      .status(403)
      .json({ ok: false, msg: "No tienes permiso para cambiar esta foto." });
  }

  if (!req.file) {
    console.log(
      "[UPLOAD PHOTO] ERROR: No se encontró req.file. Multer falló o el campo del form no es 'profilePhoto'."
    );
    return res
      .status(400)
      .json({ ok: false, msg: "No se ha subido ningún archivo." });
  }

  console.log("[UPLOAD PHOTO] Archivo recibido por multer:", req.file);

  try {
    const userToUpdate = await Model.findByPk(userId);
    if (!userToUpdate) {
      console.log(
        `[UPLOAD PHOTO] ERROR: ${Model.name} con ID ${userId} no encontrado en la DB.`
      );
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado." });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    console.log("[UPLOAD PHOTO] URL generada:", photoUrl);

    userToUpdate.photo = photoUrl;
    await userToUpdate.save();

    console.log(
      "[UPLOAD PHOTO] ÉXITO: URL guardada en la DB. Enviando respuesta."
    );
    res.status(200).json({
      ok: true,
      msg: "Foto de perfil actualizada.",
      data: { photoUrl },
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL GUARDAR FOTO EN DB >>>>>", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor al guardar la foto.",
    });
  }
};

exports.uploadClientPhoto = (req, res) => uploadProfilePhoto(req, res, User);
exports.uploadEmployeePhoto = (req, res) =>
  uploadProfilePhoto(req, res, Employee);
