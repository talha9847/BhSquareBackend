const { Customer } = require("../models/customerModel");
const sequelize = require("../config/db");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const { Stage } = require("../models/stegeModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { CustomerDocument } = require("../models/customerDocumentModel");
const { CustomerDocumentFile } = require("../models/customerDocumentFileModel");
const { Permission } = require("../models/permissionModel");
const { NameChange } = require("../models/nameChangeModel");

async function getCustomersWithLeadData() {
  try {
    const sequelize = require("../config/db");

    const customers = await Customer.findAll({
      where: { status: "pending" },
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
            "installation_type",
          ],
        },
      ],
      order: [[sequelize.col("lead.created_at"), "DESC"]],
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
        { status: "done", completed_at: new Date() },
        { where: { customer_id, stage_id: 1 }, transaction: t },
      );

      const nextStageId = name_change === "required" ? 2 : 3;

      await CustomerStage.update(
        { status: "pending", started_at: new Date() },
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

async function getCustomerStages(customerId) {
  try {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    const stages = await CustomerStage.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Stage,
          as: "stage",
          attributes: ["id", "stage_name"],
        },
      ],
      order: [["stage_id", "ASC"]],
    });

    // Map to desired format
    const result = stages.map((s) => ({
      id: s.stage_id,
      name: s.stage?.stage_name || "Unknown",
      status: s.status,
      started_at: s.started_at,
      completed_at: s.completed_at,
      note: s.note || "",
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching customer stages:", error);
    return { success: false, message: error.message };
  }
}

async function getCustomerStagesByLeadId(leadId) {
  try {
    if (!leadId) {
      throw new Error("leadId is required");
    }

    // Step 1: Find customer
    const customer = await Customer.findOne({
      where: { lead_id: leadId },
      attributes: ["id"],
    });

    if (!customer) {
      return { success: false, message: "Customer not found" };
    }

    // Step 2: Call your existing service
    return await getCustomerStages(customer.id);
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: error.message };
  }
}

async function getCustomersByStatus(status) {
  try {
    if (!status) {
      throw new Error("Status is required (pending or done)");
    }

    const customers = await Customer.findAll({
      where: { status },
      include: [
        {
          model: Lead,
          as: "lead",
          attributes: [
            "id",
            "customer_name",
            "contact_number",
            "site_visit_date",
            "address",
            "total_capacity",
            "created_at",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const result = customers.map((c) => ({
      customer_id: c.id,
      lead_id: c.lead?.id || null,
      status: c.status,
      customer_name: c.lead?.customer_name || null,
      contact_number: c.lead?.contact_number || null,
      address: c.lead?.address || null,
      site_visit_date: c.lead?.site_visit_date || null,
      total_capacity: c.lead?.total_capacity || null,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching customers by status:", error);
    return { success: false, message: error.message };
  }
}

async function deleteCustomerWithLead(customerId) {
  const transaction = await sequelize.transaction();

  try {
    if (!customerId) {
      throw new Error("Customer id is required");
    }

    const customer = await Customer.findByPk(customerId, { transaction });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const leadId = customer.lead_id;

    const documents = await CustomerDocument.findAll({
      where: { customer_id: customerId },
      attributes: ["id"],
      transaction,
    });

    await CustomerRegistration.destroy({
      where: { customer_id: customerId },
      transaction,
    });
    const documentIds = documents.map((doc) => doc.id);

    if (documentIds.length > 0) {
      await CustomerDocumentFile.destroy({
        where: {
          document_id: documentIds,
        },
        transaction,
      });
    }

    await NameChange.destroy({
      where: { customer_id: customerId },
      transaction,
    });
    await CustomerDocument.destroy({
      where: { customer_id: customerId },
      transaction,
    });

    await Permission.destroy({
      where: { customer_id: customerId },
      transaction,
    });

    await Customer.destroy({
      where: { id: customerId },
      transaction,
    });

    await Lead.destroy({
      where: { id: leadId },
      transaction,
    });

    await transaction.commit();

    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting customer with lead:", error);
    throw error;
  }
}

module.exports = {
  getCustomersWithLeadData,
  updateCustomerNameChange,
  getCustomerStages,
  getCustomersByStatus,
  getCustomerStagesByLeadId,
  deleteCustomerWithLead,
};
