module.exports = (sequelize, DataTypes) => {
  const appointment = sequelize.define("appointments", {
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return appointment;
};
