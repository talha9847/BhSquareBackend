const { Dispatch } = require("../models/dispatchModel");
const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");

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
      ],
      order: [["created_at", "DESC"]],
    });

    const result = dispatches.map((d) => ({
      id: d.id,
      customer_id: d.customer_id, // ✅ added here
      customer_name: d.customer?.lead?.customer_name || null,
      address: d.customer?.lead?.address || null,
      contact: d.customer?.lead?.contact_number || null,
      driver_name: d.driver_name || null,
      vehicle: d.vehicle || null,
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
  driver_name,
  vehicle,
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
    dispatch.driver_name = driver_name ?? dispatch.driver_name;
    dispatch.vehicle = vehicle ?? dispatch.vehicle;
    dispatch.status = status ?? dispatch.status;

    await dispatch.save({ transaction: t });

    // 3. Update stage 7 → done
    await CustomerStage.update(
      { status: "done" },
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

module.exports = { getAllDispatches, updateDispatchByCustomerId };
