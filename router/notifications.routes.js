const Routes = require("express").Router();
const notificationsController = require("../controllers/notifications.controller");
const authenticateToken = require("../middlewares/authMiddleware");

Routes.use(authenticateToken);

Routes.get("/", notificationsController.getNotifications);
Routes.post("/read-all", notificationsController.markAllAsRead);
Routes.put("/:notificationId/read", notificationsController.markOneAsRead);

module.exports = Routes;
