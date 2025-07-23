"use strict";
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
      type: DataTypes.ENUM("scheduled", "completed", "cancelled", "no-show"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    offeringId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  appointment.associate = function (models) {
    appointment.belongsTo(models.Employee, {
      foreignKey: "employeeId",
      as: "employee",
    });
    appointment.belongsTo(models.Offering, {
      foreignKey: "offeringId",
      as: "offering",
    });
    appointment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "userId",
    });
  };

  return appointment;
};
