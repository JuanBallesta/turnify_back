const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authClientsController = require("../controllers/authClients.controller");
const authenticateToken = require("../middlewares/authMiddleware");

// --- RUTAS PÚBLICAS ---
router.post("/register", authController.register);
router.post("/admin/login", authController.login);
router.post("/login", authClientsController.login);

// --- RUTAS PROTEGIDAS ---

// CAMBIO DE CONTRASEÑA PARA EMPLEADOS/ADMINS
router.put(
  "/employees/change-password",
  authenticateToken,
  authController.changePassword
);

// CAMBIO DE CONTRASEÑA PARA CLIENTES
router.put(
  "/clients/change-password",
  authenticateToken,
  authClientsController.changePassword
);

module.exports = router;
