const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authClients = require("./../controllers/authClients.controller");

// Registro
router.post("/register", authController.register);

// Admin Login
router.post("/admin/login", authController.login);

router.post("/login", authClients.login);

module.exports = router;
