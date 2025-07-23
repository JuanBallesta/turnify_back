const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
app.use(express.json());

require("./router/index.routes")(app);

const uploadsPath = path.join(process.cwd(), "public", "uploads");
console.log(`Sirviendo archivos estáticos desde: ${uploadsPath}`);
app.use("/uploads", express.static(uploadsPath));

const db = require("./models/index.model");
db.sequelize
  .sync()
  // .sync({ alter: true })
  .then(() => {
    console.log("Base de datos conectada");
  })
  .catch((error) => {
    console.log("Error al conectar a la base de datos: ", error);
  });

app.listen(port, () => {
  console.log(`Servidor en funcionamiento en el puerto ${port}`);
});
