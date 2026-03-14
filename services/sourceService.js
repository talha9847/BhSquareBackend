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

module.exports = { getSources };
