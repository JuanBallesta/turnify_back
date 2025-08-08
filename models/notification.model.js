"use strict";
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "notification",
    {
      userId: {
        type: DataTypes.INTEGER,

        allowNull: true,
        references: { model: "Users", key: "id" },
      },

      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Employees", key: "id" },
      },

      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "Notifications",
    }
  );

  Notification.associate = function (models) {
    Notification.belongsTo(models.User, { foreignKey: "userId", as: "user" });

    Notification.belongsTo(models.Employee, {
      foreignKey: "employeeId",
      as: "employee",
    });
  };

  return Notification;
};
