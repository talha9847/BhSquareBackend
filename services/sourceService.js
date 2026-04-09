const sequelize = require("../config/db");
const { Customer } = require("../models/customerModel");
const { CustomerStage } = require("../models/customerStageModel");
const { Fabricator } = require("../models/fabricatorModel");
const { FinalStage } = require("../models/finalStageModel");
const { Lead } = require("../models/leadModel");
const { Page } = require("../models/pageModel");
const { Permission } = require("../models/permissionModel");
const { Source } = require("../models/sourceModel");
const { Technician } = require("../models/technicianModel");
const { WebLead } = require("../models/webLeadModel");
const { Op } = require("sequelize");

async function getSources() {
  try {
    const sources = await Source.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return sources;
  } catch (error) {
    throw error;
  }
}

async function addSource(name) {
  try {
    if (!name) {
      throw new Error("Source name is required");
    }

    const source = await Source.create({
      name,
    });

    return source;
  } catch (error) {
    throw error;
  }
}

async function getAllSources() {
  try {
    const fabricators = await Source.findAll({
      order: [["created_at", "DESC"]],
    });
    return fabricators;
  } catch (error) {
    console.error("Error fetching fabricators:", error);
    throw error;
  }
}

async function updateSources(
  id,
  { name, commercial_commission, residential_commission },
) {
  const t = await sequelize.transaction();
  try {
    const fabricator = await Source.findByPk(id, { transaction: t });
    if (!fabricator) {
      throw new Error("Fabricator not found");
    }

    fabricator.name = name ?? fabricator.name;
    fabricator.commercial_commission =
      commercial_commission ?? fabricator.commercial_commission;
    fabricator.residential_commission =
      residential_commission ?? fabricator.residential_commission;

    await fabricator.save({ transaction: t });
    await t.commit();

    return fabricator;
  } catch (error) {
    await t.rollback();
    console.error("Error updating fabricator:", error);
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
          as: "customer",
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

    return finalStages.map((f) => ({
      final_stage_id: f.id,
      customer_id: f.customer_id,

      lead_id: f.customer?.lead?.id || null,
      customer_name: f.customer?.lead?.customer_name || null,
      contact_number: f.customer?.lead?.contact_number || null,
      address: f.customer?.lead?.address || null,

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

async function updateStage10(customerId, flag) {
  const t = await sequelize.transaction();

  try {
    if (!customerId || typeof flag !== "boolean") {
      throw new Error("customerId and boolean flag are required");
    }

    const stage10 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 10 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!stage10) {
      throw new Error("Stage 10 not found");
    }

    const [finalStage] = await FinalStage.findOrCreate({
      where: { customer_id: customerId },
      defaults: {
        customer_id: customerId,
        created_at: new Date(),
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (flag === true) {
      await stage10.update(
        {
          status: "done",
          completed_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      const stage11 = await CustomerStage.findOne({
        where: { customer_id: customerId, stage_id: 11 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!stage11) {
        throw new Error("Stage 11 not found");
      }

      await stage11.update(
        {
          status: "pending",
          started_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          file_approved: true,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    if (flag === false) {
      await stage10.update(
        {
          status: "pending",
          completed_at: null,
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          file_approved: false,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    await t.commit();

    return {
      success: true,
      message:
        flag === true
          ? "Stage 10 completed, stage 11 started, file approved"
          : "Stage 10 reset and file approval removed",
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating stage 10:", error);
    throw error;
  }
}

async function updateStage11(customerId, flag) {
  const t = await sequelize.transaction();

  try {
    if (!customerId || typeof flag !== "boolean") {
      throw new Error("customerId and boolean flag are required");
    }

    const stage11 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 11 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!stage11) {
      throw new Error("Stage 10 not found");
    }

    const [finalStage] = await FinalStage.findOrCreate({
      where: { customer_id: customerId },
      defaults: {
        customer_id: customerId,
        created_at: new Date(),
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const prevStage = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 10 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!prevStage || prevStage.status !== "done") {
      throw new Error("Stage 10 must be completed before Stage 11");
    }

    if (flag === true) {
      await stage11.update(
        {
          status: "done",
          completed_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      const stage12 = await CustomerStage.findOne({
        where: { customer_id: customerId, stage_id: 12 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!stage12) {
        throw new Error("Stage 11 not found");
      }

      await stage12.update(
        {
          status: "pending",
          started_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          file_uploaded: true,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    if (flag === false) {
      await stage11.update(
        {
          status: "pending",
          completed_at: null,
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          file_uploaded: false,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    await t.commit();

    return {
      success: true,
      message:
        flag === true
          ? "Stage 11 completed, stage 11 started, file approved"
          : "Stage 11 reset and file approval removed",
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating stage 11:", error);
    throw error;
  }
}

async function updateStage12(customerId, flag) {
  const t = await sequelize.transaction();

  try {
    if (!customerId || typeof flag !== "boolean") {
      throw new Error("customerId and boolean flag are required");
    }

    const stage12 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 12 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!stage12) {
      throw new Error("Stage 10 not found");
    }

    const [finalStage] = await FinalStage.findOrCreate({
      where: { customer_id: customerId },
      defaults: {
        customer_id: customerId,
        created_at: new Date(),
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // ✅ Check if previous stage (11) is completed
    const prevStage = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 11 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!prevStage || prevStage.status !== "done") {
      throw new Error("Stage 11 must be completed before Stage 12");
    }
    if (flag === true) {
      await stage12.update(
        {
          status: "done",
          completed_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      const stage13 = await CustomerStage.findOne({
        where: { customer_id: customerId, stage_id: 13 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!stage13) {
        throw new Error("Stage 11 not found");
      }

      await stage13.update(
        {
          status: "pending",
          started_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          inspection: true,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    if (flag === false) {
      await stage12.update(
        {
          status: "pending",
          completed_at: null,
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          inspection: false,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    await t.commit();

    return {
      success: true,
      message:
        flag === true
          ? "Stage 12 completed, stage 11 started, file approved"
          : "Stage 12 reset and file approval removed",
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating stage 11:", error);
    throw error;
  }
}

async function updateStage13(customerId, flag) {
  const t = await sequelize.transaction();

  try {
    if (!customerId || typeof flag !== "boolean") {
      throw new Error("customerId and boolean flag are required");
    }

    const stage13 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 13 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!stage13) {
      throw new Error("Stage 13 not found");
    }

    const [finalStage] = await FinalStage.findOrCreate({
      where: { customer_id: customerId },
      defaults: {
        customer_id: customerId,
        created_at: new Date(),
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // ✅ Check if previous stage (11) is completed
    const prevStage = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 12 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!prevStage || prevStage.status !== "done") {
      throw new Error("Stage 11 must be completed before Stage 12");
    }
    if (flag === true) {
      await stage13.update(
        {
          status: "done",
          completed_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      const stage14 = await CustomerStage.findOne({
        where: { customer_id: customerId, stage_id: 14 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!stage14) {
        throw new Error("Stage 11 not found");
      }

      await stage14.update(
        {
          status: "pending",
          started_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          redeem: true,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    if (flag === false) {
      await stage13.update(
        {
          status: "pending",
          completed_at: null,
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          redeem: false,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    await t.commit();

    return {
      success: true,
      message:
        flag === true
          ? "Stage 13 completed, stage 11 started, file approved"
          : "Stage 13 reset and file approval removed",
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating stage 13:", error);
    throw error;
  }
}

async function getAllMasters() {
  try {
    const [technicians, fabricators, leadSources] = await Promise.all([
      Technician.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      }),

      Fabricator.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      }),

      Source.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      }),
    ]);

    return {
      success: true,
      data: {
        technicians,
        fabricators,
        sources: leadSources,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching master data:", error);
    throw error;
  }
}
const getCustomersBySource = async (sourceId) => {
  try {
    const customers = await Customer.findAll({
      include: [
        {
          model: Lead,
          as: "lead",
          required: true,
          where: {
            source_id: sourceId,
          },
          attributes: [
            "customer_name",
            "contact_number",
            "address",
            "total_capacity",
          ],
        },
        {
          model: Permission,
          as: "permissions",
          required: false,
          where: {
            source_id: sourceId,
          },
          include: [
            {
              model: Page,
              as: "page",
              attributes: ["id", "name", "url"],
            },
          ],
          attributes: ["id", "is_permitted"],
        },
      ],
    });

    return customers;
  } catch (error) {
    throw error;
  }
};
async function getPermissionsByCustomerAndLead(customerId, leadId) {
  try {
    // ✅ Fetch customer with lead + source (ONLY ONCE)
    const customer = await Customer.findOne({
      where: { id: customerId },
      attributes: ["id"],
      include: [
        {
          model: Lead,
          as: "lead",
          where: { id: leadId },
          attributes: ["id", "customer_name"],
          include: [
            {
              model: Source,
              as: "source",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!customer) {
      throw new Error("Customer or Lead not found");
    }

    // ✅ Fetch permissions separately (no nesting)
    const permissions = await Permission.findAll({
      where: { customer_id: customerId },
      attributes: ["id", "page_id", "is_permitted"],
      include: [
        {
          model: Page,
          as: "page",
          attributes: ["id", "name", "url"],
        },
      ],
      order: [["page_id", "ASC"]],
    });

    // ✅ Final clean response
    return {
      customer,
      permissions,
    };
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
}

async function updatePermission(permissionId, isPermitted) {
  try {
    // ✅ Validate input
    if (typeof isPermitted !== "boolean") {
      throw new Error("isPermitted must be true or false");
    }

    // ✅ Find permission
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      throw new Error("Permission not found");
    }

    // ✅ Update value
    await permission.update({
      is_permitted: isPermitted,
    });

    return permission;
  } catch (error) {
    console.error("Error updating permission:", error);
    throw error;
  }
}

async function checkPermissionForPage(customerId, pageId) {
  try {
    if (!customerId || !pageId) {
      throw new Error("customerId and pageId are required");
    }

    const permission = await Permission.findOne({
      where: {
        customer_id: customerId,
        page_id: pageId,
      },
      attributes: ["id", "is_permitted"],
    });

    // Return boolean: true if permitted, false otherwise
    return permission ? permission.is_permitted : false;
  } catch (error) {
    console.error("Error checking permission:", error);
    throw error;
  }
}

async function addWebLead(data) {
  try {
    const { name, mobile, address } = data;

    if (!name || !mobile) {
      throw new Error("name and mobile are required");
    }

    // Check if mobile already exists
    const existingLead = await WebLead.findOne({ mobile });

    if (existingLead) {
      return true; // Mobile already exists
    }

    // Create new lead if not exists
    const lead = await WebLead.create({
      name,
      mobile,
      address,
    });

    return lead;
  } catch (error) {
    throw error;
  }
}

async function getAllWebLeads() {
  try {
    const leads = await WebLead.findAll({
      where: {
        status: {
          [Op.in]: ["pending", "contacted"],
        },
      },
      order: [["created_at", "DESC"]],
    });

    return leads;
  } catch (error) {
    console.error("Error fetching web leads:", error);
    throw error;
  }
}

async function updateWebLead(data) {
  try {
    const { id, name, mobile, address, status } = data;

    if (!id) {
      throw new Error("id is required");
    }

    const lead = await WebLead.findByPk(id);

    if (!lead) {
      throw new Error("Web lead not found");
    }

    // update only provided fields
    if (name !== undefined) lead.name = name;
    if (mobile !== undefined) lead.mobile = mobile;
    if (address !== undefined) lead.address = address;
    if (status !== undefined) lead.status = status;

    await lead.save();

    return lead;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getSources,
  addSource,
  getFinalStageCustomers,
  updateStage10,
  updateStage11,
  updateStage12,
  updateStage13,
  getAllMasters,
  getAllSources,
  updateSources,
  getCustomersBySource,
  getPermissionsByCustomerAndLead,
  updatePermission,
  checkPermissionForPage,
  addWebLead,
  getAllWebLeads,
};
