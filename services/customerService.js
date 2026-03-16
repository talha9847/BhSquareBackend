const { Customer } = require("../models/customerModel");
const sequelize = require("../config/db");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");

async function getCustomersWithLeadData() {
  try {
    const sequelize = require("../config/db");

    const customers = await Customer.findAll({
      include: [
        {
          model: Lead,
          as: "lead",
          attributes: [
            "customer_name",
            "contact_number",
            "site_visit_date",
            "address",
            "total_capacity",
          ],
        },
      ],
      order: [
        [
          sequelize.literal(`
        CASE 
          WHEN "Customer"."status" = 'pending' THEN 0
          WHEN "Customer"."status" = 'done' THEN 1
          ELSE 2
        END
      `),
          "ASC",
        ],
        [sequelize.col("lead.created_at"), "DESC"],
      ],
    });

    return customers;
  } catch (error) {
    throw error;
  }
}

async function updateCustomerNameChange(customer_id, name_change) {
  const validValues = ["not_used", "required", "changed", "unchanged"];
  if (!validValues.includes(name_change)) throw new Error("Invalid value");

  const t = await sequelize.transaction();

  try {
    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) throw new Error("Customer not found");

    await Customer.update(
      { name_change },
      { where: { id: customer_id }, transaction: t },
    );

    if (name_change === "required" || name_change === "unchanged") {
      await CustomerStage.update(
        { status: "done", updated_at: new Date() },
        { where: { customer_id, stage_id: 1 }, transaction: t },
      );

      const nextStageId = name_change === "required" ? 2 : 3;

      await CustomerStage.update(
        { status: "pending", updated_at: new Date() },
        { where: { customer_id, stage_id: nextStageId }, transaction: t },
      );
    }

    await t.commit();
    return await Customer.findByPk(customer_id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = { getCustomersWithLeadData, updateCustomerNameChange };
