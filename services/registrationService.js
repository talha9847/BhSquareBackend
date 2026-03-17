const sequelize = require("../config/db");
const { Lead } = require("../models/leadModel");
const { Customer } = require("../models/customerModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
async function getCustomersWithSummary() {
  try {
    const customers = await Customer.findAll({
      attributes: ["id"],

      include: [
        {
          model: Lead,
          as: "lead",
          attributes: [
            "customer_name",
            "contact_number",
            "address",
            "number_of_panels",
            "total_capacity",
            "created_at",
          ],
        },
        {
          model: CustomerRegistration,
          as: "registration",
          attributes: ["id", "status"], // registration status
          required: true, // ✅ only include customers who have a registration
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

module.exports = { getCustomersWithSummary };
