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
module.exports = { fetchSources };
