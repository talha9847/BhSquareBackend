const sequelize = require("../config/db");
const { Estimation } = require("../models/estimationModel");
const { EstimationType } = require("../models/estimationTypeModel");

async function getEstimations() {
  try {
    const estimations = await Estimation.findAll({
      attributes: ["id", "type_id", "name", "qty", "price", "gst"],
      include: [
        {
          model: EstimationType,
          as: "type",
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return estimations;
  } catch (error) {
    throw error;
  }
}

async function getEstimationTypes() {
  try {
    const estimationTypes = await EstimationType.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return estimationTypes;
  } catch (error) {
    throw error;
  }
}

async function addEstimation(data) {
  try {
    const { type_id, name, qty, price, gst } = data;

    // Check estimation type exists
    const estimationType = await EstimationType.findByPk(type_id);

    if (!estimationType) {
      throw new Error("Estimation type not found");
    }

    const estimation = await Estimation.create({
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return estimation;
  } catch (error) {
    throw error;
  }
}

async function updateEstimation(id, data) {
  try {
    const { type_id, name, qty, price, gst } = data;
    console.log("this is the gst   ", gst);
    const estimation = await Estimation.findByPk(id);

    if (!estimation) {
      throw new Error("Estimation not found");
    }

    // Check estimation type exists
    if (type_id !== undefined) {
      const estimationType = await EstimationType.findByPk(type_id);

      if (!estimationType) {
        throw new Error("Estimation type not found");
      }
    }

    await estimation.update({
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return estimation;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getEstimations,
  getEstimationTypes,
  addEstimation,
  updateEstimation,
};
