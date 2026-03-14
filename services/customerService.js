const { Customer } = require("../models/customerModel");

const { Lead } = require("../models/leadModel");

async function getCustomersWithLeadData() {
  try {
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
          ],
        },
      ],
      order: [["created_at", "DESC"]], 
    });
    return customers;
  } catch (error) {
    throw error;
  }
}

module.exports = { getCustomersWithLeadData };
