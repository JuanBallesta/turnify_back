const Routes = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");
const authenticateToken = require("../middlewares/authMiddleware");

Routes.get("/stats", authenticateToken, dashboardController.getDashboardStats);

module.exports = Routes;
