module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;
  const employeeOffering = sequelize.define("employeeOfferings", {
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    offeringId: { type: DataTypes.INTEGER, allowNull: false },
  });

  return employeeOffering;
};
