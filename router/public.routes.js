const Routes = require("express").Router();
const publicController = require("../controllers/public.controller");

Routes.get("/businesses/:slug", publicController.getPublicBusinessProfile);

module.exports = Routes;
