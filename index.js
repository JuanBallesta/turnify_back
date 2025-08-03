const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:8080", // Permite solo peticiones desde tu frontend
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Permite todos los métodos HTTP comunes
    credentials: true, // Permite el envío de cookies o cabeceras de autorización
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("./router/index.routes")(app);

const uploadsPath = path.join(process.cwd(), "public", "uploads");
console.log(`Sirviendo archivos estáticos desde: ${uploadsPath}`);
app.use("/uploads", express.static(uploadsPath));

const db = require("./models/index.model");
db.sequelize
  .sync()
  // .sync({ alter: true })
  .then(() => {
    console.log("Base de datos conectada y sincronizada.");
  })
  .catch((error) => {
    console.log("Error al conectar a la base de datos: ", error);
  });

app.listen(port, () => {
  console.log(`Servidor en funcionamiento en el puerto ${port}`);
});
