const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    // Verificación de seguridad: req.user DEBE existir en este punto.
    if (!req.user || !req.user.id) {
      // Si el middleware de autenticación falló, detenemos la subida aquí.
      return cb(new Error("Autenticación requerida para nombrar el archivo."));
    }
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("¡Solo se permiten archivos de imagen!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = upload.single("profilePhoto");
