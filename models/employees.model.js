module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;
  const employees = sequelize.define("employees", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return employees;
};
