const router = require("express").Router();
const availabilityController = require("../controllers/availability.controller");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, availabilityController.getAvailability);

module.exports = router;
