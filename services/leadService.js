const sequelize = require("../config/db");
const { Op } = require("sequelize");
const { Lead } = require("../models/leadModel");
const { LeadDelay } = require("../models/leadDelayModel");
const { Customer } = require("../models/customerModel");
const { Stage } = require("../models/stegeModel");
const { CustomerStage } = require("../models/customerStageModel");
const { LeadCancellation } = require("../models/leadCancellationModel");
const { Source } = require("../models/sourceModel");

async function addLead(data) {
  try {
    const total_capacity =
      data.panel_wattage && data.number_of_panels
        ? data.panel_wattage * data.number_of_panels
        : null;

    const lead = await Lead.create({
      customer_name: data.customer_name,
      contact_number: data.contact_number,
      site_visit_date: data.site_visit_date,
      source_id: data.source_id,
      address: data.address,
      notes: data.notes,
      status: data.status,
      installation_type: data.installation_type,
      panel_wattage: data.panel_wattage,
      number_of_panels: data.number_of_panels,
      inverter_kw: data.inverter_kw,
      number_of_inverters: data.number_of_inverters,
    });

    return lead;
  } catch (error) {
    throw error;
  }
}

async function getPendingLeads() {
  try {
    const leads = await Lead.findAll({
      where: {
        status: "pending",
      },
      order: [["created_at", "DESC"]], // optional: latest first
    });

    return leads;
  } catch (error) {
    throw error;
  }
}

async function getLeadsByStatus(status) {
  try {
    const leads = await Lead.findAll({
      where: { status },
      order: [["created_at", "DESC"]], // optional: newest first
    });
    return leads;
  } catch (error) {
    throw error;
  }
}

async function getPendingLeadsCount() {
  try {
    const count = await Lead.count({
      where: {
        status: "pending",
      },
    });

    return count;
  } catch (error) {
    throw error;
  }
}

async function delayLeadTransaction({ lead_id, next_visit_date, note }) {
  const t = await sequelize.transaction();

  try {
    let delay = await LeadDelay.findOne({ where: { lead_id }, transaction: t });

    if (delay) {
      delay.next_visit_date = next_visit_date;
      delay.note = note;
      await delay.save({ transaction: t });
    } else {
      delay = await LeadDelay.create(
        { lead_id, next_visit_date, note },
        { transaction: t },
      );
    }

    const [updatedRows] = await Lead.update(
      { status: "delayed", site_visit_date: next_visit_date },
      { where: { id: lead_id }, transaction: t },
    );

    if (updatedRows === 0) {
      throw new Error("Lead not found or update failed");
    }

    await t.commit();
    return delay;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function delayToPending(lead_id) {
  const t = await sequelize.transaction();

  try {
    const [updatedRows] = await Lead.update(
      { status: "pending" },
      {
        where: {
          id: lead_id,
          status: {
            [Op.in]: ["delayed", "cancelled"],
          },
        },
        transaction: t,
      },
    );

    if (updatedRows === 0) {
      throw new Error("Lead not found or not in delayed status");
    }

    await LeadDelay.destroy({ where: { lead_id }, transaction: t });
    await LeadCancellation.destroy({ where: { lead_id }, transaction: t });

    await t.commit();
    return { success: true, message: "Lead converted to pending" };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function convertToCustomer(lead_id) {
  const t = await sequelize.transaction();

  try {
    const lead = await Lead.findByPk(lead_id, { transaction: t });
    if (!lead) {
      throw new Error("Lead not found");
    }

    await lead.update({ status: "converted" }, { transaction: t });

    const customer = await Customer.create(
      { lead_id: lead.id },
      { transaction: t },
    );

    const stages = await Stage.findAll({
      order: [["default_order", "ASC"]],
      transaction: t,
    });

    const customerStagesData = stages.map((stage, index) => ({
      customer_id: customer.id,
      stage_id: stage.id,
      status: index === 0 ? "pending" : "not_used",
      started_at: new Date(),
    }));

    await CustomerStage.bulkCreate(customerStagesData, { transaction: t });

    await t.commit();

    return customer;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function cancelLead({ lead_id, reason }) {
  const t = await sequelize.transaction();

  try {
    const lead = await Lead.findByPk(lead_id, { transaction: t });
    if (!lead) throw new Error("Lead not found");

    await Lead.update(
      { status: "cancelled" },
      { where: { id: lead_id }, transaction: t },
    );

    const cancellation = await LeadCancellation.create(
      { lead_id, reason },
      { transaction: t },
    );

    await t.commit();
    return cancellation;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function updateLead({ id, ...updateData }) {
  try {
    const [updatedRows] = await Lead.update(updateData, {
      where: { id },
    });

    if (updatedRows === 0) {
      throw new Error("Lead not found or no changes made");
    }

    const lead = await Lead.findByPk(id);
    return lead;
  } catch (error) {
    throw error;
  }
}

async function getLeadById(id) {
  try {
    if (!id) {
      throw new Error("Lead id is required");
    }

    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: Source,
          as: "source", // make sure alias matches your association
          attributes: ["id", "name"],
        },
      ],
    });

    if (!lead) {
      return {
        success: false,
        message: "Lead not found",
      };
    }

    // 🔹 Format response
    const result = {
      id: lead.id,
      customer_name: lead.customer_name,
      contact_number: lead.contact_number,
      address: lead.address,
      site_visit_date: lead.site_visit_date,
      status: lead.status,
      installation_type: lead.installation_type,
      panel_wattage: lead.panel_wattage,
      number_of_panels: lead.number_of_panels,
      total_capacity: lead.total_capacity,
      source: lead.source?.source_name || null,
      notes: lead.notes,
      created_at: lead.created_at,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching lead by id:", error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  addLead,
  getPendingLeads,
  getLeadsByStatus,
  getPendingLeadsCount,
  delayLeadTransaction,
  delayToPending,
  convertToCustomer,
  cancelLead,
  updateLead,
  getLeadById,
};
