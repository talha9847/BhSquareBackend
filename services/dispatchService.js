const { Dispatch } = require("../models/dispatchModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");
const { Fabricator } = require("../models/fabricatorModel");
const { Fabrication } = require("../models/fabricationModel");
const { Wiring } = require("../models/wiringModel");
const { Inventory } = require("../models/inventoryModel");
const { Car } = require("../models/carModel");
const { Driver } = require("../models/driverModel");

async function getAllDispatches() {
  try {
    const dispatches = await Dispatch.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "address", "contact_number"],
            },
          ],
        },
        {
          model: Driver,
          as: "driver",
          attributes: ["name"],
        },
        {
          model: Car,
          as: "car",
          attributes: ["name", "number"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const result = dispatches.map((d) => ({
      id: d.id,
      customer_id: d.customer_id,

      // ✅ NEW
      driver_id: d.driver_id || null,
      car_id: d.car_id || null,

      customer_name: d.customer?.lead?.customer_name || null,
      address: d.customer?.lead?.address || null,
      contact: d.customer?.lead?.contact_number || null,

      driver_name: d.driver?.name || null,
      vehicle: d.car ? `${d.car.name} (${d.car.number})` : null,

      status: d.status || null,
      date: d.created_at
        ? new Date(d.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    }));

    return result;
  } catch (error) {
    console.error("Error fetching dispatches:", error);
    throw error;
  }
}

async function updateDispatchByCustomerId({
  customer_id,
  driver_id,
  car_id,
  status,
}) {
  const t = await sequelize.transaction();

  try {
    // 1. Find dispatch by customer_id
    const dispatch = await Dispatch.findOne({
      where: { customer_id },
      transaction: t,
    });

    if (!dispatch) {
      throw new Error("Dispatch not found");
    }

    // 2. Update dispatch fields
    dispatch.driver_id = driver_id ?? dispatch.driver_id;
    dispatch.car_id = car_id ?? dispatch.car_id;
    dispatch.status = status ?? dispatch.status;

    await dispatch.save({ transaction: t });

    // 3. Update stage 7 → done
    await CustomerStage.update(
      { status: "done", completed_at: new Date() },
      {
        where: {
          customer_id,
          stage_id: 7,
        },
        transaction: t,
      },
    );

    // 4. Update stage 8 → pending
    await CustomerStage.update(
      { status: "pending" },
      {
        where: {
          customer_id,
          stage_id: 8,
        },
        transaction: t,
      },
    );

    const [fabrication, created] = await Fabrication.findOrCreate({
      where: { customer_id },
      defaults: { customer_id, status: "pending", unused_pipes: 0 },
      transaction: t,
    });

    if (!created) {
      console.log(
        "Fabrication record already exists for customer:",
        customer_id,
      );
    }

    // Commit transaction
    await t.commit();

    return {
      message: "Dispatch & stages updated successfully",
      data: dispatch,
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating dispatch:", error);
    throw error;
  }
}

async function getAllFabricators() {
  try {
    const fabricators = await Fabricator.findAll({
      order: [["created_at", "DESC"]],
    });
    return fabricators;
  } catch (error) {
    console.error("Error fetching fabricators:", error);
    throw error;
  }
}

async function addFabricator({ name }) {
  try {
    const [fabricator, created] = await Fabricator.findOrCreate({
      where: { name },
      defaults: { name },
    });

    if (!created) {
      console.log("Fabricator already exists:", name);
    }

    return fabricator;
  } catch (error) {
    console.error("Error creating fabricator:", error);
    throw error;
  }
}

async function updateFabricator(id, { name }) {
  const t = await sequelize.transaction();
  try {
    const fabricator = await Fabricator.findByPk(id, { transaction: t });
    if (!fabricator) {
      throw new Error("Fabricator not found");
    }

    fabricator.name = name ?? fabricator.name;

    await fabricator.save({ transaction: t });
    await t.commit();

    return fabricator;
  } catch (error) {
    await t.rollback();
    console.error("Error updating fabricator:", error);
    throw error;
  }
}

/**
 * Get all fabrication records with customer & fabricator info
 */
async function getAllFabrications() {
  try {
    const fabrications = await Fabrication.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number", "address"],
            },
          ],
        },
        {
          model: Fabricator,
          as: "fabricator",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Map to desired output
    const result = fabrications.map((f) => ({
      id: f.id,
      customer_id: f.customer_id,
      customer_name: f.customer?.lead?.customer_name || null,
      contact_number: f.customer?.lead?.contact_number || null,
      address: f.customer?.lead?.address || null,
      fabricator_id: f.fabricator_id,
      fabricator_name: f.fabricator?.name || null,
      status: f.status,
      unused_pipes: f.unused_pipes,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));

    return result;
  } catch (error) {
    console.error("Error fetching fabrications:", error);
    throw error;
  }
}

async function updateFabricationByCustomerId({ customer_id, unused_pipes }) {
  const t = await sequelize.transaction();
  try {
    const fabrication = await Fabrication.findOne({
      where: { customer_id },
      transaction: t,
    });

    if (!fabrication) {
      throw new Error("Fabrication record not found for this customer");
    }

    // 2️⃣ Only proceed if a fabricator is assigned
    if (fabrication.fabricator_id && Number(fabrication.fabricator_id) > 0) {
      // Update unused_pipes if provided
      if (unused_pipes && Number(unused_pipes) > 0) {
        fabrication.unused_pipes = Number(unused_pipes);

        // Example: Update inventory (replace 5 with actual inventory_id)
        const inventoryItem = await Inventory.findByPk(5, { transaction: t });
        if (inventoryItem) {
          inventoryItem.qty =
            (Number(inventoryItem.qty) || 0) + Number(unused_pipes);
          await inventoryItem.save({ transaction: t });
        }
      }

      // 3️⃣ Always set fabrication status to 'done'
      fabrication.status = "done";
      await fabrication.save({ transaction: t });

      // 4️⃣ Create wiring record for this customer
      await Wiring.create(
        { customer_id, status: "pending" },
        { transaction: t },
      );

      // 5️⃣ Update customer stages
      await CustomerStage.update(
        { status: "done", completed_at: new Date() },
        { where: { customer_id, stage_id: 8 }, transaction: t },
      );
      await CustomerStage.update(
        { status: "pending" },
        { where: { customer_id, stage_id: 9 }, transaction: t },
      );

      // 6️⃣ Commit transaction
      await t.commit();

      return {
        message:
          "Fabrication updated, wiring record created, and inventory updated successfully",
        data: fabrication,
      };
    } else {
      throw new Error("Assign Fabricator");
    }
  } catch (error) {
    await t.rollback();
    console.error("Error updating fabrication or inventory:", error);
    throw error;
  }
}

async function assignFabricatorByCustomerId({ customer_id, fabricator_id }) {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Find the fabrication record by customer_id
    const fabrication = await Fabrication.findOne({
      where: { customer_id },
      transaction: t,
    });

    if (!fabrication) {
      throw new Error("Fabrication record not found for this customer");
    }

    fabrication.fabricator_id = fabricator_id;
    await fabrication.save({ transaction: t });

    await t.commit();

    return {
      success: true,
      message: `Fabricator assigned successfully for customer_id ${customer_id}`,
      data: fabrication,
    };
  } catch (error) {
    await t.rollback();
    console.error("Error assigning fabricator:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 CREATE
async function addCar({ name, number }) {
  try {
    const [car, created] = await Car.findOrCreate({
      where: { number },
      defaults: { name, number },
    });

    if (!created) {
      return {
        success: false,
        message: "Car with this number already exists",
      };
    }

    return {
      success: true,
      data: car,
      message: "Car created successfully",
    };
  } catch (error) {
    console.error("Error creating car:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 FETCH ALL
async function getAllCars() {
  try {
    const cars = await Car.findAll({
      order: [["created_at", "DESC"]],
    });

    return {
      success: true,
      data: cars,
    };
  } catch (error) {
    console.error("Error fetching cars:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 UPDATE
async function updateCar(id, { name, number }) {
  const t = await sequelize.transaction();
  try {
    const car = await Car.findByPk(id, { transaction: t });

    if (!car) {
      throw new Error("Car not found");
    }

    // Check duplicate number
    if (number) {
      const existing = await Car.findOne({
        where: { number },
        transaction: t,
      });

      if (existing && existing.id !== car.id) {
        throw new Error("Car number already exists");
      }
    }

    // Update fields
    car.name = name ?? car.name;
    car.number = number ?? car.number;

    await car.save({ transaction: t });
    await t.commit();

    return {
      success: true,
      data: car,
      message: "Car updated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating car:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 CREATE
async function addDriver({ name, mobile }) {
  try {
    const [driver, created] = await Driver.findOrCreate({
      where: { mobile },
      defaults: { name, mobile },
    });

    if (!created) {
      return {
        success: false,
        message: "Driver with this mobile already exists",
      };
    }

    return {
      success: true,
      data: driver,
      message: "Driver created successfully",
    };
  } catch (error) {
    console.error("Error creating driver:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 FETCH ALL
async function getAllDrivers() {
  try {
    const drivers = await Driver.findAll({
      order: [["created_at", "DESC"]],
    });

    return {
      success: true,
      data: drivers,
    };
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return { success: false, message: error.message };
  }
}

// 🔹 UPDATE
async function updateDriver(id, { name, mobile }) {
  const t = await sequelize.transaction();
  try {
    const driver = await Driver.findByPk(id, { transaction: t });

    if (!driver) {
      throw new Error("Driver not found");
    }

    // Check duplicate mobile
    if (mobile) {
      const existing = await Driver.findOne({
        where: { mobile },
        transaction: t,
      });

      if (existing && existing.id !== driver.id) {
        throw new Error("Mobile number already exists");
      }
    }

    // Update fields
    driver.name = name ?? driver.name;
    driver.mobile = mobile ?? driver.mobile;

    await driver.save({ transaction: t });
    await t.commit();

    return {
      success: true,
      data: driver,
      message: "Driver updated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating driver:", error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  getAllDispatches,
  updateDispatchByCustomerId,
  getAllFabricators,
  addFabricator,
  updateFabricator,
  getAllFabrications,
  updateFabricationByCustomerId,
  assignFabricatorByCustomerId,
  addCar,
  getAllCars,
  updateCar,
  addDriver,
  getAllDrivers,
  updateDriver,
};
