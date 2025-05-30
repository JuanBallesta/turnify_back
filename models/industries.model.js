module.exports = (sequelize, DataTypes) => {
  const industries = sequelize.define("industries", {
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return industries;
};
