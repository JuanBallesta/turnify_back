module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define("Schedule", {
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Employees",
        key: "id",
      },
    },

    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  });

  Schedule.associate = function (models) {
    Schedule.belongsTo(models.Employee, {
      foreignKey: "employeeId",
      as: "employee",
    });
  };

  return Schedule;
};
