const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authClients = require("./../controllers/authClients.controller");
const authenticateAdminToken = require("../middlewares/authAdminMiddleware");
const authenticateToken = require("../middlewares/authMiddleware");

// Registro
router.post("/register", authController.register);

// Admin Login
router.post("/admin/login", authController.login);
router.post("/admin/refreshToken", authenticateAdminToken);

router.post("/login", authClients.login);
router.post("/refreshToken", authenticateToken);

module.exports = router;
