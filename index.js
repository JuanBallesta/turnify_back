require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { startReminderCronJob } = require("./services/cron.service");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares básicos
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsPath));

// Rutas de la API
require("./router/index.routes")(app);

// Conexión y sincronización de la base de datos
const db = require("./models/index.model");
db.sequelize
  .sync()
  // .sync({ alter: true })
  .then(() => {
    console.log("Base de datos conectada y sincronizada.");
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
  });

// Arranque del servidor
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en el puerto ${port}`);
  startReminderCronJob();
});
