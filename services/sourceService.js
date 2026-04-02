const { Customer } = require("../models/customerModel");
const { FinalStage } = require("../models/finalStageModel");
const { Lead } = require("../models/leadModel");
const { Source } = require("../models/sourceModel");

async function getSources() {
  try {
    const sources = await Source.findAll({
      attributes: ["id", "source_name"],
      order: [["id", "ASC"]],
    });

    return sources;
  } catch (error) {
    throw error;
  }
}

async function addSource(source_name) {
  try {
    if (!source_name) {
      throw new Error("Source name is required");
    }

    const source = await Source.create({
      source_name,
    });

    return source;
  } catch (error) {
    throw error;
  }
}

async function getFinalStageCustomers() {
  try {
    const finalStages = await FinalStage.findAll({
      attributes: [
        "id",
        "customer_id",
        "file_approved",
        "file_uploaded",
        "inspection",
        "redeem",
        "disbursal",
        "created_at",
      ],
      include: [
        {
          model: Customer,
          as: "customer", // 👈 must match association
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // 🔹 Format response
    return finalStages.map((f) => ({
      final_stage_id: f.id,
      customer_id: f.customer_id,

      // Lead info
      lead_id: f.customer?.lead?.id || null,
      customer_name: f.customer?.lead?.customer_name || null,
      contact_number: f.customer?.lead?.contact_number || null,
      address: f.customer?.lead?.address || null,

      // Final stage flags
      file_uploaded: f.file_uploaded,
      file_approved: f.file_approved,
      inspection: f.inspection,
      redeem: f.redeem,
      disbursal: f.disbursal,

      created_at: f.created_at,
    }));
  } catch (error) {
    console.error("Error fetching final stage customers:", error);
    throw error;
  }
}
module.exports = { getSources, addSource, getFinalStageCustomers };
