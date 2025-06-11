module.exports = (sequelize, DataTypes) => {
  const UserType = sequelize.define("userTypes", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return UserType;
};
