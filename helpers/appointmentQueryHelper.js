const db = require("../models/index.model");
const { Op } = require("sequelize");
const Employee = db.employees;
const User = db.users;

const buildAppointmentWhereClause = async (user, query) => {
  const { id, role, businessId, email } = user;
  const { status, dateFilter, view } = query;

  let where = {};

  if (role === "administrator" && view === "personal") {
    const adminAsClient = await User.findOne({ where: { email } });
    if (adminAsClient) {
      where.userId = adminAsClient.id;
    } else {
      where.id = -1;
    }
  } else if (role === "administrator") {
    const employeesInBusiness = await Employee.findAll({
      where: { businessId },
      attributes: ["id"],
    });
    const employeeIds = employeesInBusiness.map((e) => e.id);
    if (employeeIds.length > 0) {
      where.employeeId = { [Op.in]: employeeIds };
    } else {
      where.id = -1;
    }
  } else if (role === "client") {
    where.userId = id;
  } else if (role === "employee") {
    where.employeeId = id;
  }

  if (status && status !== "all") {
    where.status = status;
  }

  if (dateFilter && dateFilter !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (dateFilter === "today") {
      where.startTime = { [Op.between]: [today, endOfToday] };
    } else if (dateFilter === "upcoming") {
      where.startTime = { [Op.gte]: today };
    } else if (dateFilter === "past") {
      where.startTime = { [Op.lt]: today };
    }
  }

  return where;
};

module.exports = { buildAppointmentWhereClause };
