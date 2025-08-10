const db = require("../models/index.model");
const Notification = db.notification;
const User = db.users;
const Employee = db.employees;

if (!Notification || !User || !Employee) {
  console.error(
    "ERROR CRÍTICO: Uno o más modelos no se cargaron para notifications.controller."
  );
}

exports.getNotifications = async (req, res) => {
  const { id, role } = req.user;

  const whereCondition = {};
  if (role === "client") {
    whereCondition.userId = id;
  } else {
    whereCondition.employeeId = id;
  }

  try {
    const notifications = await Notification.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
      limit: 30,
    });

    res.status(200).json({
      ok: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error interno al obtener notificaciones." });
  }
};

exports.markAllAsRead = async (req, res) => {
  const { id, role } = req.user;

  const whereCondition = {};
  if (role === "client") {
    whereCondition.userId = id;
  } else {
    whereCondition.employeeId = id;
  }

  whereCondition.isRead = false;

  try {
    const [updateCount] = await Notification.update(
      { isRead: true },
      { where: whereCondition }
    );

    res.status(200).json({
      ok: true,
      msg: `${updateCount} notificaciones marcadas como leídas.`,
    });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    res
      .status(500)
      .json({ ok: false, msg: "Error interno al actualizar notificaciones." });
  }
};

exports.markOneAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const { id: userId, role } = req.user;

  try {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res
        .status(404)
        .json({ ok: false, msg: "Notificación no encontrada." });
    }

    const isOwner =
      (role === "client" && notification.userId === userId) ||
      (role !== "client" && notification.employeeId === userId);
    if (!isOwner) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para modificar esta notificación.",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      ok: true,
      msg: "Notificación marcada como leída.",
      data: notification,
    });
  } catch (error) {
    console.error("Error al marcar una notificación como leída:", error);
    res.status(500).json({ ok: false, msg: "Error interno." });
  }
};
