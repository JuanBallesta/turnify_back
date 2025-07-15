const multer = require("multer");
const path = require("path");

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  // Dónde se guardarán los archivos
  destination: function (req, file, cb) {
    // Es importante que la carpeta 'public/uploads' exista
    cb(null, "public/uploads/");
  },
  // Cómo se nombrarán los archivos
  filename: function (req, file, cb) {
    // Generamos un nombre único para evitar colisiones: user-ID-timestamp.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Filtro para aceptar solo imágenes
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
  limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB por archivo
});

// Exportamos un middleware que espera un solo archivo con el nombre de campo 'profilePhoto'
module.exports = upload.single("profilePhoto");
