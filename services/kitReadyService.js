const { KitReady } = require("../models/kitReadyModel");
const { Brand } = require("../models/brandModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");
const { Loan } = require("../models/loanModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { FileGeneration } = require("../models/fileGenerationModel");
const { Op } = require("sequelize");
const { PanelSerial } = require("../models/panelSerialModel");
const { InverterSerial } = require("../models/inverterSerialModel");
const { Dispatch } = require("../models/dispatchModel");
const { Category } = require("../models/categoryModel");

async function getKitReadyCustomers() {
  try {
    const data = await KitReady.findAll({
      attributes: ["id", "loan_status", "status"],
      where: { status: "pending" },
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
        { status: "pending", started_at: new Date() },
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
        { status: "pending", started_at: new Date() },
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
  const { name, brand_id, category_id, qty, price, tax } = data;

  try {
    // 🔹 Validate inventory name
    if (!name) {
      throw new Error("Inventory name is required");
    }

    // 🔹 Validate brand_id if provided
    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        throw new Error("Invalid brand_id");
      }
    }

    // 🔹 Validate category_id if provided
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        throw new Error("Invalid category_id");
      }
    }

    // 🔹 Create inventory
    const inventory = await Inventory.create({
      name: name.trim(),
      brand_id: brand_id || null,
      category_id: category_id || null,
      qty: qty || 0,
      price: price,
      tax: tax,
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
        {
          model: Category,
          as: "category",
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
      category_id: item.category_id,
      category_name: item.category?.name || null, // ✅ flattened
      qty: item.qty, // updated field name if using stock
      price: item.price,
      tax: item.tax,
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
async function updateInventory(id, data) {
  try {
    const { name, brand_id, category_id, qty, price, tax } = data;

    // 🔹 Validate inventory ID
    if (!id) {
      throw new Error("Inventory id is required");
    }

    // 🔹 Validate name
    if (!name) {
      throw new Error("Inventory name is required");
    }

    // 🔹 Validate quantity
    if (qty === undefined || qty === null) {
      throw new Error("Quantity is required");
    }

    const numericQty = Number(qty);
    if (isNaN(numericQty)) {
      throw new Error("Quantity must be a valid number");
    }

    // 🔹 Fetch inventory
    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      throw new Error("Inventory not found");
    }

    // 🔹 Validate brand_id if provided
    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        throw new Error("Invalid brand_id");
      }
    }

    // 🔹 Validate category_id if provided
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        throw new Error("Invalid category_id");
      }
    }

    // 🔹 Update quantity (additive logic)
    const updatedQty = inventory.qty + numericQty;
    if (updatedQty < 0) {
      throw new Error("Insufficient stock");
    }

    // 🔹 Update inventory
    await inventory.update({
      name: name.trim().toUpperCase(),
      brand_id: brand_id || null,
      category_id: category_id || null,
      qty: updatedQty,
      price: price,
      tax: tax,
    });

    return inventory;
  } catch (error) {
    throw error;
  }
}

async function deleteInventory(id) {
  try {
    if (!id) {
      throw new Error("Inventory id is required");
    }

    const inventory = await Inventory.findByPk(id);

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    await inventory.destroy();

    return true;
  } catch (error) {
    throw error;
  }
}

async function addKitItemsByCustomer(customerId) {
  const transaction = await sequelize.transaction();

  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    // 🔹 Find the kit for this customer (100% present)
    const kit = await KitReady.findOne({
      where: { customer_id: customerId },
      attributes: ["id"],
      transaction,
    });

    if (!kit) {
      throw new Error("Kit not found for this customer");
    }

    // 🔹 Check if kit items already exist for this kit
    const existing = await KitItems.findOne({
      where: { kit_id: kit.id },
      transaction,
    });

    if (existing) {
      await transaction.rollback();
      return { message: "Kit items already exist for this customer" };
    }

    // 🔹 Inventory IDs to insert
    const inventoryIds = [6, 7, 8, 9, 10];

    const items = inventoryIds.map((invId) => ({
      kit_id: kit.id,
      inventory_id: invId,
      qty: 0,
      status: "pending",
    }));

    // 🔹 Bulk insert
    await KitItems.bulkCreate(items, { transaction });

    await transaction.commit();

    return { message: "Kit items inserted successfully" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getKitItemsByCustomer(customerId) {
  if (!customerId) throw new Error("Customer ID is required");

  // 🔹 Find the kit
  const kit = await KitReady.findOne({
    where: { customer_id: customerId },
    attributes: ["id"],
  });

  if (!kit) throw new Error("Kit not found for this customer");

  // 🔹 Fetch kit items with inventory + brand + category
  const kitItems = await KitItems.findAll({
    where: { kit_id: kit.id },
    include: [
      {
        model: Inventory,
        as: "inventory",
        attributes: ["id", "name", "qty", "brand_id", "category_id"],
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"], // assuming category has name
          },
        ],
      },
    ],
  });

  // 🔹 Format response
  return kitItems.map((item) => ({
    id: item.id,
    inventoryId: item.inventory_id,
    name: item.inventory?.name || null,
    qty: item.qty,
    verified: item.status === "pending" ? false : true,
    stock: item.inventory?.qty || null,

    brandId: item.inventory?.brand?.id || null,
    brand: item.inventory?.brand?.name || null,

    // ✅ NEW: category
    categoryId: item.inventory?.category?.id || null,
    category: item.inventory?.category?.name || null,
  }));
}

async function getAvailableProductsForKit(customerId) {
  if (!customerId) throw new Error("Customer ID is required");

  // 🔹 Find kit
  const kit = await KitReady.findOne({
    where: { customer_id: customerId },
    attributes: ["id"],
  });

  if (!kit) throw new Error("Kit not found for this customer");

  // 🔹 Get inventory IDs already in kit
  const kitItems = await KitItems.findAll({
    where: { kit_id: kit.id },
    attributes: ["inventory_id"],
  });

  const inventoryIdsInKit = kitItems.map((item) => item.inventory_id);

  // 🔹 Fetch products NOT in kit
  const availableProducts = await Inventory.findAll({
    where: {
      id: {
        [Op.notIn]: inventoryIdsInKit.length ? inventoryIdsInKit : [0],
      },
      // optional: only show in-stock items
      // qty: { [Op.gt]: 0 }
    },
    attributes: ["id", "name", "qty", "brand_id"],
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name"],
      },
    ],
  });

  // 🔹 Format response
  return availableProducts.map((product) => ({
    kit_id: kit.id, // ✅ added this
    id: product.id,
    name: product.name,
    stock: product.qty,
    brandId: product.brand?.id || null,
    brand: product.brand?.name || null,
  }));
}

async function addItemToKit({ kit_id, inventory_id }) {
  if (!kit_id || !inventory_id) {
    throw new Error("kit_id and inventory_id are required");
  }

  // 🔹 Check if inventory exists
  const inventory = await Inventory.findByPk(inventory_id);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  // 🔹 Prevent duplicate (even though DB has unique constraint)
  const existingItem = await KitItems.findOne({
    where: { kit_id, inventory_id },
  });

  if (existingItem) {
    throw new Error("Item already exists in kit");
  }

  // 🔹 Create new kit item
  const newItem = await KitItems.create({
    kit_id,
    inventory_id,
    qty: 0,
    status: "pending",
  });

  return {
    id: newItem.id,
    kit_id: newItem.kit_id,
    inventory_id: newItem.inventory_id,
    qty: newItem.qty,
    status: newItem.status,
  };
}

async function allocateKitItem({ kit_item_id, qty }) {
  const t = await sequelize.transaction();

  try {
    const kitItem = await KitItems.findByPk(kit_item_id, { transaction: t });

    if (!kitItem) {
      throw new Error("Kit item not found");
    }

    const inventory = await Inventory.findByPk(kitItem.inventory_id, {
      transaction: t,
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    if (inventory.qty < qty) {
      throw new Error("Insufficient stock");
    }

    await Inventory.update(
      { qty: inventory.qty - qty },
      { where: { id: inventory.id }, transaction: t },
    );

    await KitItems.update(
      { qty, status: "allocated" },
      { where: { id: kit_item_id }, transaction: t },
    );

    await t.commit();

    return { success: true, message: "Allocated successfully" };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getPanelAndInverterByCustomerId(customerId) {
  try {
    // Step 1: get registration id
    const registration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
      attributes: ["id"],
    });

    if (!registration) {
      return { panel_qty: 0, inverter_qty: 0, kit_status: null };
    }

    // Step 2: get panel/inverter from file_generation
    const fileGen = await FileGeneration.findOne({
      where: { registration_id: registration.id },
      attributes: ["panel_quantity", "inverter_quantity"],
    });

    // Step 3: get kit_ready status
    const kitReady = await KitReady.findOne({
      where: { customer_id: customerId },
      attributes: ["status"],
    });

    return {
      panel_qty: fileGen?.panel_quantity || 0,
      inverter_qty: fileGen?.inverter_quantity || 0,
      kit_status: kitReady?.status || null,
    };
  } catch (error) {
    console.error("Error fetching panel/inverter/kit status:", error);
    throw error;
  }
}

async function addSerialsAndDispatch(
  customerId,
  // panelSerials,
  // inverterSerials,
) {
  const t = await sequelize.transaction();

  try {
    // Prepare panel data
    // const panelData = panelSerials.map((serial) => ({
    //   customer_id: customerId,
    //   serial_number: serial.trim(),
    //   created_at: new Date(),
    // }));

    // Prepare inverter data
    // const inverterData = inverterSerials.map((serial) => ({
    //   customer_id: customerId,
    //   serial_number: serial.trim(),
    //   created_at: new Date(),
    // }));

    // // Bulk insert panels
    // if (panelData.length > 0) {
    //   await PanelSerial.bulkCreate(panelData, { transaction: t });
    // }

    // // Bulk insert inverters
    // if (inverterData.length > 0) {
    //   await InverterSerial.bulkCreate(inverterData, { transaction: t });
    // }

    // Update customer stages
    await CustomerStage.update(
      { status: "done", completed_at: new Date() },
      { where: { customer_id: customerId, stage_id: 6 }, transaction: t },
    );

    await CustomerStage.update(
      { status: "pending", started_at: new Date() },
      { where: { customer_id: customerId, stage_id: 7 }, transaction: t },
    );

    // Insert dispatch record with defaults
    await Dispatch.create(
      {
        customer_id: customerId,
        delivered: false,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    await KitReady.update(
      { status: "done" },
      { where: { customer_id: customerId }, transaction: t },
    );

    await t.commit();

    return {
      dispatch_created: true,
    };
  } catch (error) {
    await t.rollback();
    console.error(
      "Error inserting serials / updating stages / creating dispatch:",
      error,
    );
    throw error;
  }
}

async function getKitItemsByCustomerId(customerId) {
  try {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    // 🔹 Step 1: Find kit_ready
    const kit = await KitReady.findOne({
      where: { customer_id: customerId },
    });

    if (!kit) {
      return {
        success: false,
        message: "Kit not found for this customer",
      };
    }

    // 🔹 Step 2: Find kit items
    const items = await KitItems.findAll({
      where: { kit_id: kit.id },
      include: [
        {
          model: Inventory,
          as: "inventory", // must match association
          attributes: ["id", "name"], // adjust fields as per your table
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // 🔹 Step 3: Format response
    const result = {
      kit_id: kit.id,
      customer_id: kit.customer_id,
      status: kit.status,

      items: items.map((item) => ({
        id: item.id,
        inventory_id: item.inventory_id,
        item_name: item.inventory?.name || null,
        qty: item.qty,
        status: item.status,
        created_at: item.created_at,
      })),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching kit items:", error);
    return { success: false, message: error.message };
  }
}

async function getKitReadyCustomersByStatus(status) {
  try {
    if (!status || !["pending", "done"].includes(status)) {
      throw new Error("Invalid status. Must be 'pending' or 'done'");
    }

    const data = await KitReady.findAll({
      where: { status }, // ✅ filter by kit_ready status
      attributes: ["id", "loan_status", "status"],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "status"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
      ],

      order: [["id", "ASC"]],
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("❌ Error fetching kit ready customers:", error);
    return { success: false, message: error.message };
  }
}

async function addCategory(data) {
  try {
    const { name } = data;

    if (!name) {
      throw new Error("Category name is required");
    }

    const normalizedName = name.trim().toUpperCase();

    const existing = await Category.findOne({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new Error("Category already exists");
    }

    const category = await Category.create({
      name: normalizedName,
    });

    return category;
  } catch (error) {
    throw error;
  }
}

async function updateCategory(id, data) {
  try {
    const { name } = data;

    if (!id) {
      throw new Error("Category id is required");
    }

    if (!name) {
      throw new Error("Category name is required");
    }

    const category = await Category.findByPk(id);

    if (!category) {
      throw new Error("Category not found");
    }

    const normalizedName = name.trim().toUpperCase();

    const existing = await Category.findOne({
      where: { name: normalizedName },
    });

    if (existing && existing.id !== Number(id)) {
      throw new Error("Category already exists");
    }

    await category.update({
      name: normalizedName,
    });

    return category;
  } catch (error) {
    throw error;
  }
}

async function getCategories() {
  try {
    return await Category.findAll({
      order: [["id", "ASC"]],
    });
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
  updateInventory,
  deleteInventory,
  addKitItemsByCustomer,
  getKitItemsByCustomer,
  getAvailableProductsForKit,
  addItemToKit,
  allocateKitItem,
  getPanelAndInverterByCustomerId,
  addSerialsAndDispatch,
  getKitItemsByCustomerId,
  getKitReadyCustomersByStatus,
  addCategory,
  updateCategory,
  getCategories,
};
