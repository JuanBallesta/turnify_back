module.exports = (sequelize, DataTypes) => {
  const extraField = sequelize.define("extraFields", {
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  return extraField;
};
