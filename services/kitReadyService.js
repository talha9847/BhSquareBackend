const { KitReady } = require("../models/kitReadyModel");
const { Brand } = require("../models/brandModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");
const { Loan } = require("../models/loanModel");
const { Inventory } = require("../models/inventoryModel");

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

async function getAllBrands() {
  try {
    const brands = await Brand.findAll({
      attributes: ["id", "name"], // only return id & name
      order: [["name", "ASC"]], // optional sorting
    });

    return brands;
  } catch (error) {
    throw error;
  }
}

async function addInventory(data) {
  const { name, brand_id, qty } = data;

  try {
    if (!name) {
      throw new Error("Inventory name is required");
    }

    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        throw new Error("Invalid brand_id");
      }
    }

    const inventory = await Inventory.create({
      name,
      brand_id: brand_id || null,
      qty: qty || 0,
    });

    return inventory;
  } catch (error) {
    throw error;
  }
}

async function getAllInventory() {
  try {
    const inventory = await Inventory.findAll({
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = inventory.map((item) => ({
      id: item.id,
      name: item.name,
      brand_id: item.brand_id,
      brand_name: item.brand?.name || null, // ✅ flattened
      qty: item.qty,
      created_at: item.created_at,
    }));

    return formatted;
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    throw error;
  }
}

async function addBrand(data) {
  try {
    const { name } = data;

    if (!name) {
      throw new Error("Brand name is required");
    }

    const existing = await Brand.findOne({
      where: { name },
    });

    if (existing) {
      throw new Error("Brand already exists");
    }

    const brand = await Brand.create({
      name: name.trim(),
    });

    return brand;
  } catch (error) {
    throw error;
  }
}

async function updateBrand(id, data) {
  try {
    const { name } = data;

    if (!id) {
      throw new Error("Brand id is required");
    }

    if (!name) {
      throw new Error("Brand name is required");
    }

    const brand = await Brand.findByPk(id);

    if (!brand) {
      throw new Error("Brand not found");
    }

    const existing = await Brand.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        name.toLowerCase(),
      ),
    });

    if (existing && existing.id !== Number(id)) {
      throw new Error("Brand already exists");
    }

    await brand.update({
      name: name.trim().toUpperCase(),
    });

    return brand;
  } catch (error) {
    throw error;
  }
}

async function deleteBrand(id) {
  try {
    // 🔹 Validate
    if (!id) {
      throw new Error("Brand id is required");
    }

    // 🔹 Check brand exists
    const brand = await Brand.findByPk(id);

    if (!brand) {
      throw new Error("Brand not found");
    }

    // 🔹 Check if brand is used in inventory
    const isUsed = await Inventory.findOne({
      where: { brand_id: id },
    });

    if (isUsed) {
      throw new Error("Cannot delete brand. It is used in inventory.");
    }

    // 🔹 Delete brand
    await brand.destroy();

    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getKitReadyCustomers,
  updateLoanStatus,
  getAllBrands,
  addInventory,
  getAllInventory,
  addBrand,
  updateBrand,
  deleteBrand,
};
