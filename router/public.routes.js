const Routes = require("express").Router();
const publicController = require("../controllers/public.controller");

// Esta ruta no necesita autenticación
Routes.get("/businesses/:slug", publicController.getPublicBusinessProfile);

module.exports = Routes;
