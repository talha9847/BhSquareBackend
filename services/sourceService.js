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
module.exports = { getSources, addSource };
