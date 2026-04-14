const sequelize = require("../config/db");
const { Commission } = require("../models/commissionModel");
const { Completion } = require("../models/completionModel");
const { Customer } = require("../models/customerModel");
const { CustomerStage } = require("../models/customerStageModel");
const { Fabricator } = require("../models/fabricatorModel");
const { FinalStage } = require("../models/finalStageModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { KitReady } = require("../models/kitReadyModel");
const { Lead } = require("../models/leadModel");
const { Page } = require("../models/pageModel");
const { Permission } = require("../models/permissionModel");
const { Source } = require("../models/sourceModel");
const { Technician } = require("../models/technicianModel");
const { WebLead } = require("../models/webLeadModel");
const { Op } = require("sequelize");
const { Wiring } = require("../models/wiringModel");
const { WiringItem } = require("../models/wiringItemModel");
const { WireInventory } = require("../models/wireInventoryModel");
const { Supervisor } = require("../models/supervisorModel");

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
async function getSupervisor() {
  try {
    const sources = await Supervisor.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return sources;
  } catch (error) {
    throw error;
  }
}

async function addSource(name, commercial_commission, residential_commission) {
  try {
    if (!name) {
      throw new Error("Source name is required");
    }

    const source = await Source.create({
      name,
      commercial_commission,
      residential_commission,
    });

    return source;
  } catch (error) {
    throw error;
  }
}
async function addSupervisor(
  name,
  residential_commission,
  commercial_commission,
) {
  try {
    if (!name) {
      throw new Error("Supervisor name is required");
    }

    const source = await Supervisor.create({
      name,
      commercial_commission,
      residential_commission,
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
async function getAllSupervisors() {
  try {
    const fabricators = await Supervisor.findAll({
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

async function updateSupervisor(
  id,
  { name, commercial_commission, residential_commission },
) {
  const t = await sequelize.transaction();
  try {
    const fabricator = await Supervisor.findByPk(id, { transaction: t });
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

    const stage11 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 11 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 🔴 NEW RULE: if stage 14 is already done, block stage 13 changes
    if (stage11 && stage11.status === "done") {
      throw new Error(
        "Stage 11 already completed. Stage 12 cannot be modified.",
      );
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

    const stage12 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 12 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 🔴 NEW RULE: if stage 14 is already done, block stage 13 changes
    if (stage12 && stage12.status === "done") {
      throw new Error(
        "Stage 12 already completed. Stage 11 cannot be modified.",
      );
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

    const stage13 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 13 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 🔴 NEW RULE: if stage 14 is already done, block stage 13 changes
    if (stage13 && stage13.status === "done") {
      throw new Error(
        "Stage 13 already completed. Stage 12 cannot be modified.",
      );
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

    const stage14 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 14 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 🔴 NEW RULE: if stage 14 is already done, block stage 13 changes
    if (stage14 && stage14.status === "done") {
      throw new Error(
        "Stage 14 already completed. Stage 13 cannot be modified.",
      );
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

async function updateStage14(customerId, flag) {
  const t = await sequelize.transaction();
  try {
    if (!customerId || typeof flag !== "boolean") {
      throw new Error("customerId and boolean flag are required");
    }

    const stage14 = await CustomerStage.findOne({
      where: { customer_id: customerId, stage_id: 14 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!stage14) {
      throw new Error("Stage 14 not found");
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
      where: { customer_id: customerId, stage_id: 13 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!prevStage || prevStage.status !== "done") {
      throw new Error("Stage 13 must be completed before Stage 14");
    }
    if (flag === true) {
      await stage14.update(
        {
          status: "done",
          completed_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );

      // const stage15 = await CustomerStage.findOne({
      //   where: { customer_id: customerId, stage_id: 15 },
      //   transaction: t,
      //   lock: t.LOCK.UPDATE,
      // });

      // if (!stage15) {
      //   throw new Error("Stage 11 not found");
      // }

      // await stage15.update(
      //   {
      //     status: "pending",
      //     started_at: new Date(),
      //     updated_at: new Date(),
      //   },
      //   { transaction: t },
      // );

      // 🔥 IMPORTANT: await + pass transaction
      const completionResult = await createCompletionByCustomerId(
        customerId,
        t,
      );

      if (!completionResult?.success) {
        throw new Error(
          completionResult?.message || "Completion creation failed",
        );
      }
      await finalStage.update(
        {
          disbursal: true,
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    if (flag === false) {
      await stage14.update(
        {
          status: "pending",
          completed_at: null,
          updated_at: new Date(),
        },
        { transaction: t },
      );

      await finalStage.update(
        {
          disbursal: false,
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
async function createCompletionByCustomerId(customerId, transaction = null) {
  const t = transaction || (await sequelize.transaction());
  let external = !!transaction;

  try {
    // 🔹 check existing completion
    const existing = await Completion.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    // ✅ IMPORTANT: just skip, do NOT throw error
    if (existing) {
      return {
        success: true,
        skipped: true,
        message: "Completion already exists",
        data: existing,
      };
    }
    /////////////////
    ///// kit cost
    /////////////

    const kit = await KitReady.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!kit) {
      throw new Error("Kit not found");
    }

    const kitItems = await KitItems.findAll({
      where: { kit_id: kit.id },
      include: [
        {
          model: Inventory,
          as: "inventory",
          attributes: ["price"],
        },
      ],
      transaction: t,
    });

    if (!kitItems.length) {
      throw new Error("No kit items found");
    }

    let kitCost = 0;

    for (const item of kitItems) {
      kitCost += Number(item.inventory?.price || 0) * Number(item.qty || 0);
    }

    /////////////
    /// wire cost
    ////////

    const wiring = await Wiring.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    let wireCost = 0;

    if (wiring) {
      const wiringItems = await WiringItem.findAll({
        where: { wiring_id: wiring.id },
        include: [
          {
            model: WireInventory,
            as: "wire",
            attributes: ["price"],
          },
        ],
        transaction: t,
      });

      for (const w of wiringItems) {
        wireCost += Number(w.wire?.price || 0) * Number(w.qty || 1);
      }
    }

    const completion = await Completion.create(
      {
        customer_id: customerId,
        kit_cost: kitCost,
        wire_cost: wireCost,
        remarks: "Auto generated",
      },
      { transaction: t },
    );

    if (!external) await t.commit();

    return {
      success: true,
      skipped: false,
      data: completion,
    };
  } catch (error) {
    if (!external) await t.rollback();
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
      order: [["created_at", "DESC"]],
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

async function getPaidCommissionBySourceId(sourceId) {
  try {
    if (!sourceId) {
      throw new Error("sourceId is required");
    }

    const commissions = await Commission.findAll({
      where: {
        source_id: sourceId,
        status: "paid",
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "address"],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "customer_id",
        "total_kw",
        "type",
        "commission",
        "created_at",
      ],
    });

    if (!commissions || commissions.length === 0) {
      return [];
    }

    // 🔹 format response
    return commissions.map((item) => ({
      id: item.id,
      customer_id: item.customer_id,
      customer_name: item.customer?.lead?.customer_name || null,
      address: item.customer?.lead?.address || null,
      total_kw: item.total_kw,
      type: item.type,
      commission: item.commission,
      created_at: item.created_at,
    }));
  } catch (error) {
    throw error;
  }
}

async function getCompletionReport({ startDate, endDate }) {
  try {
    let whereCondition = {};

    // 🔹 default = current month
    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      startDate = start;
      endDate = end;
    }

    whereCondition.created_at = {
      [Op.between]: [startDate, endDate],
    };

    const completions = await Completion.findAll({
      where: whereCondition,
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

    if (!completions.length) {
      return [];
    }

    return completions.map((c) => ({
      id: c.id,
      customerId: c.customer?.id,
      leadId: c.customer?.lead?.id,
      customer_name: c.customer?.lead?.customer_name || null,
      contact: c.customer?.lead?.contact_number || null,
      address: c.customer?.lead?.address || null,

      kit_cost: Number(c.kit_cost || 0),
      wire_cost: Number(c.wire_cost || 0),
      extra_cost: Number(c.extra_cost || 0),

      total_cost: c.total_cost,
      created_at: c.created_at,
    }));
  } catch (error) {
    throw error;
  }
}

async function updateExtraCostById(id, extraCost) {
  try {
    if (!id) {
      throw new Error("id is required");
    }

    if (extraCost === undefined || extraCost === null) {
      throw new Error("extra_cost is required");
    }

    // 🔹 find completion
    const completion = await Completion.findByPk(id);

    if (!completion) {
      return {
        success: false,
        message: "Completion not found",
      };
    }

    // 🔹 update extra_cost
    await completion.update({
      extra_cost: extraCost,
    });

    return {
      success: true,
      message: "Extra cost updated successfully",
      data: completion,
    };
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
  updateWebLead,
  getPaidCommissionBySourceId,
  updateStage14,
  getCompletionReport,
  updateExtraCostById,
  getSupervisor,
  getAllSupervisors,
  addSupervisor,
  updateSupervisor,
};
