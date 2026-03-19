const { KitReady } = require("../models/kitReadyModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");
const { Loan } = require("../models/loanModel");

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
  const t = await sequelize.transaction();

  try {
    if (loanRequired) {
      // 1️⃣ Update KitReady
      await KitReady.update(
        { loan_status: "required" },
        { where: { customer_id: customerId }, transaction: t },
      );

      // 2️⃣ Update CustomerStage → Loan stage (id = 5)
      await CustomerStage.update(
        { status: "pending" },
        {
          where: {
            customer_id: customerId,
            stage_id: 5,
          },
          transaction: t,
        },
      );

      // 3️⃣ Insert into Loan table if not exists
      const existingLoan = await Loan.findOne({
        where: { customer_id: customerId },
        transaction: t,
      });

      if (!existingLoan) {
        await Loan.create(
          {
            customer_id: customerId,
            bank_name: "",
            is_applied: false,
            estimated: null,
            loan_amount: null,
            interest_rate: null,
            bank_remarks: "",
            is_approved: false,
          },
          { transaction: t },
        );
      }
    } else {
      // ❌ Loan NOT required → Kit Ready stage
      await KitReady.update(
        { loan_status: "not_applicable" },
        { where: { customer_id: customerId }, transaction: t },
      );

      await CustomerStage.update(
        { status: "pending" },
        {
          where: {
            customer_id: customerId,
            stage_id: 6, // Kit Ready stage
          },
          transaction: t,
        },
      );
    }

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = { getKitReadyCustomers, updateLoanStatus };
