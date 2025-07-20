const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
const port = 3000;
app.use(express.json());

require("./router/index.routes")(app);
app.use("/uploads", express.static("public/uploads"));

const db = require("./models/index.model");
db.sequelize
  .sync()
  .then(() => {
    console.log("Base de datos conectada");
  })
  .catch((error) => {
    console.log("Error al conectar a la base de datos: ", error);
  });

app.listen(port, () => {
  console.log("Servidor en funcionamiento en el puerto 3000");
});
