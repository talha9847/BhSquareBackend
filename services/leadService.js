const sequelize = require("sequelize");

const { Lead } = require("../models/leadModel");

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

module.exports = { addLead, getPendingLeads, getLeadsByStatus };
