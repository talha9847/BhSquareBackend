const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");

async function getLeadDetailFromCustomerId(customer_id) {
  try {
    const customer = await Customer.findByPk(customer_id, {
      include: {
        model: Lead,
        as: "lead",
        attributes: [
          "id",
          "customer_name",
          "contact_number",
          "site_visit_date",
          "address",
          "total_capacity",
          "panel_wattage",
          "number_of_panels",
        ],
      },
    });

    if (!customer || !customer.lead) return null;

    return customer.lead; // return the lead object
  } catch (error) {
    throw error;
  }
}

module.exports = { getLeadDetailFromCustomerId };
