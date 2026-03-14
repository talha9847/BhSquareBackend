const sourceService = require("../services/sourceService");

async function fetchSources(req, res) {
  try {
    const sources = await sourceService.getSources();

    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addSource(req, res) {
  try {
    const { source_name } = req.body;

    if (!source_name) {
      return res.status(400).json({
        success: false,
        message: "source_name is required",
      });
    }

    const source = await sourceService.addSource(source_name);

    return res.status(201).json({
      success: true,
      message: "Source added successfully",
      data: source,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
module.exports = { fetchSources, addSource };
