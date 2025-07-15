const router = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/stats", authenticateToken, dashboardController.getDashboardStats);

module.exports = router;
