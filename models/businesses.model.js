module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;
  const business = sequelize.define("business", {
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    logo: { type: DataTypes.STRING, allowNull: false },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    website: { type: DataTypes.STRING, allowNull: true },
    instagram: { type: DataTypes.STRING, allowNull: true },
    facebook: { type: DataTypes.STRING, allowNull: true },
  });

  business.beforeValidate((business, options) => {
    if (business.name && !business.slug) {
      business.slug = business.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
  });

  return business;
};
