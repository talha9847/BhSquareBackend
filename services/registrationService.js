const sequelize = require("../config/db");
const { Lead } = require("../models/leadModel");
const { Customer } = require("../models/customerModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { PanelSerial } = require("../models/panelSerialModel");
async function getCustomersWithSummary() {
  try {
    const customers = await Customer.findAll({
      attributes: ["id"],

      include: [
        {
          model: Lead,
          as: "lead",
          attributes: [
            "id",
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
          attributes: [
            "id",
            "application_number",
            "registration_date",
            "agreement_date",
            "inverter_qty",
            "panel_qty",
            "status",
          ],
          required: true, // only include customers who have a registration
          include: [
            {
              model: PanelSerial,
              as: "panels", // make sure association alias is correct in your model
              attributes: ["id", "serial_number", "created_at"],
            },
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

async function getNumberOfPanelsByLeadId(leadId) {
  try {
    // Fetch the lead by ID
    const lead = await Lead.findByPk(leadId, {
      attributes: ["number_of_panels"], // only fetch this column
    });

    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    return { success: true, number_of_panels: lead.number_of_panels };
  } catch (error) {
    console.error("❌ Error fetching number of panels:", error);
    throw error;
  }
}

async function createCustomerRegistrationWithPanels(
  customerId,
  registrationData,
) {
  const t = await sequelize.transaction();

  try {
    // Step 1: Create or update CustomerRegistration
    let registration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (registration) {
      await registration.update(
        {
          application_number: registrationData.application_number,
          agreement_date: registrationData.agreement_date,
          inverter_qty: registrationData.inverter_qty,
          registration_date: registrationData.registration_date,
          panel_qty: registrationData.panel_qty,
          status: "approved",
        },
        { transaction: t },
      );
    } else {
      registration = await CustomerRegistration.create(
        {
          customer_id: customerId,
          application_number: registrationData.application_number,
          agreement_date: registrationData.agreement_date,
          registration_date: registrationData.registration_date,
          inverter_qty: registrationData.inverter_qty,
          panel_qty: registrationData.panel_qty,
          status: "approved",
        },
        { transaction: t },
      );
    }

    // Step 2: Handle panel serials
    if (
      registrationData.panel_serials &&
      registrationData.panel_serials.length > 0
    ) {
      // Delete existing panels if any
      await PanelSerial.destroy({
        where: { registration_id: registration.id },
        transaction: t,
      });

      // Prepare new panel rows
      const panelRows = registrationData.panel_serials.map((panel) => ({
        registration_id: registration.id,
        serial_number: panel.value,
        status: "active",
        created_at: new Date(),
      }));

      // Bulk insert
      await PanelSerial.bulkCreate(panelRows, { transaction: t });
    }

    await t.commit();
    return { success: true, registration_id: registration.id };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error creating registration with panels:", error);
    throw error;
  }
}

async function markRegistrationAsDone(registrationId) {
  const t = await sequelize.transaction();
  try {
    const registration = await CustomerRegistration.findOne({
      where: { id: registrationId },
      transaction: t,
    });

    if (!registration) {
      throw new Error(`Registration with ID ${registrationId} not found`);
    }

    if (registration.status === "approved") {
      registration.status = "done";
      await registration.save({ transaction: t });
    } else {
      return { success: false, message: `Status is not 'approved'` };
    }

    await t.commit();
    return {
      success: true,
      registration_id: registration.id,
      new_status: registration.status,
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating registration status:", error);
    throw error;
  }
}

module.exports = {
  getCustomersWithSummary,
  getNumberOfPanelsByLeadId,
  createCustomerRegistrationWithPanels,
  markRegistrationAsDone,
};
