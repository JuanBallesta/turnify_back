const Sequelize = require("sequelize");
const config = require("../config/index.config");

const sequelize = new Sequelize(
  config.db.schema,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    port: config.db.port,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar los modelos
db.userTypes = require("./userTypes.model")(sequelize, Sequelize);
db.businesses = require("./businesses.model")(sequelize, Sequelize);
db.industries = require("./industries.model")(sequelize, Sequelize);
db.employees = require("./employees.model")(sequelize, Sequelize);
db.offerings = require("./offering.model")(sequelize, Sequelize);
db.extraFields = require("./extraFields.model")(sequelize, Sequelize);
db.appointments = require("./appointments.model")(sequelize, Sequelize);
db.users = require("./users.model")(sequelize, Sequelize);

// Relaciones entre modelos

//Un empleado puede tener un solo tipo de usuario
db.userTypes.hasMany(db.employees);
db.employees.belongsTo(db.userTypes);

// Un negocio puede tener una sola industria
db.industries.hasMany(db.businesses);
db.businesses.belongsTo(db.industries);

// Un negocio tiene muchos empleados
db.businesses.hasMany(db.employees);
db.employees.belongsTo(db.businesses);

// Un negocio tiene muchos servicios
db.businesses.hasMany(db.offerings);
db.offerings.belongsTo(db.businesses);

// Un servicio puede tener muchos extraFields (campos extra)
db.offerings.hasMany(db.extraFields);
db.extraFields.belongsTo(db.offerings);

// Un empleado puede tener muchas reservas
db.employees.hasMany(db.appointments);
db.appointments.belongsTo(db.employees);

// Un servicio puede tener muchas reservas
db.offerings.hasMany(db.appointments);
db.appointments.belongsTo(db.offerings);

module.exports = db;
