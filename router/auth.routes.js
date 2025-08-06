const express = require("express");
const Routes = require("express").Router();
const authController = require("../controllers/auth.controller");
const authClientsController = require("../controllers/authClients.controller");
const authenticateToken = require("../middlewares/authMiddleware");

// --- RUTAS PÚBLICAS ---
Routes.post("/register", authController.register);
Routes.post("/admin/login", authController.login);
Routes.post("/login", authClientsController.login);

// --- RUTAS PROTEGIDAS ---

// CAMBIO DE CONTRASEÑA PARA EMPLEADOS/ADMINS
Routes.put(
  "/employees/change-password",
  authenticateToken,
  authController.changePassword
);

// CAMBIO DE CONTRASEÑA PARA CLIENTES
Routes.put(
  "/clients/change-password",
  authenticateToken,
  authClientsController.changePassword
);

module.exports = Routes;
