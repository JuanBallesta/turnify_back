module.exports = (app) => {
  const authRoutes = require("./auth.routes");
  app.use("/api", authRoutes);

  const businessRoutes = require("./businesses.routes");
  app.use("/businesses", businessRoutes);

  const industriesRoutes = require("./industries.routes");
  app.use("/industries", industriesRoutes);

  const serviceRoutes = require("./offerings.routes");
  app.use("/offerings", serviceRoutes);

  const appointmentRoutes = require("./appointments.routes");
  app.use("/appointments", appointmentRoutes);

  const employeeRoutes = require("./employees.routes");
  app.use("/employees", employeeRoutes);

  const userTypeRoutes = require("./userTypes.routes");
  app.use("/userTypes", userTypeRoutes);

  const userRoutes = require("./users/users.routes");
  app.use("/users", userRoutes);

  const userAdminRoutes = require("./employees/users.routes");
  app.use("/admin/users", userAdminRoutes);

  const scheduleRoutes = require("./schedules.routes");
  app.use("/schedules", scheduleRoutes);

  const availabilityRoutes = require("./availability.routes");
  app.use("/availability", availabilityRoutes);

  app.use("/dashboard", require("./dashboard.routes"));

  const publicRoutes = require("./public.routes");
  app.use("/public", publicRoutes);

  const aiRoutes = require("./aiRoutes");
  app.use("/ai", aiRoutes);

  const notificationRoutes = require("./notifications.routes");
  app.use("/notifications", notificationRoutes);
};
