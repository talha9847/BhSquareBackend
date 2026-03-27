const wiringService = require("../services/wiringService");

async function createTechnician(req, res) {
  try {
    const { name } = req.body;
    const technician = await wiringService.addTechnician({ name });

    return res.status(201).json({
      success: true,
      data: technician,
    });
  } catch (error) {
    console.error("Error creating technician:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create technician",
    });
  }
}

async function fetchTechnicians(req, res) {
  try {
    const technicians = await wiringService.getAllTechnicians();

    return res.status(200).json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateTechnician(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const technician = await wiringService.updateTechnician(id, { name });

    return res.status(200).json({
      success: true,
      data: technician,
    });
  } catch (error) {
    console.error("Error updating technician:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update technician",
    });
  }
}

async function fetchWiringCustomerDetails(req, res) {
  try {
    const data = await wiringService.getWiringCustomerDetails();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching wiring customer details:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wiring customer details",
    });
  }
}

module.exports = {
  updateTechnician,
  fetchTechnicians,
  createTechnician,
  fetchWiringCustomerDetails,
};
