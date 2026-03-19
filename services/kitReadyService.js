const { KitReady } = require("../models/kitReadyModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");

async function getKitReadyCustomers() {
  try {
    const data = await KitReady.findAll({
      attributes: ["id", "loan_status", "status"],
      include: [
        {
          model: Customer,
          as: "customer", // ✅ must match association
          attributes: ["id", "status"],
          include: [
            {
              model: Lead,
              as: "lead", // ✅ must match association
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    return data;
  } catch (error) {
    throw error;
  }
}

async function updateLoanStatus(loanRequired, customerId) {
  try {
    if (loanRequired) {
      await KitReady.update(
        { loan_status: "required" },
        { where: { customer_id: customerId } },
      );

      await CustomerStage.update(
        { status: "pending" },
        {
          where: {
            customer_id: customerId,
            stage_id: 5,
          },
        },
      );
    } else {
      await KitReady.update(
        { loan_status: "not_applicable" },
        { where: { customer_id: customerId } },
      );

      await CustomerStage.update(
        { status: "pending" },
        {
          where: {
            customer_id: customerId,
            stage_id: 6,
          },
        },
      );
    }

    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = { getKitReadyCustomers, updateLoanStatus };
