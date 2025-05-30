module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;
  const business = sequelize.define("business", {
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    logo: { type: DataTypes.STRING, allowNull: false },
  });

  return business;
};
