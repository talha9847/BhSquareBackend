// models/associationModel.js

const { Customer } = require("./customerModel");
const { Lead } = require("./leadModel");
const { CustomerRegistration } = require("./customerRegistrationModel");
const { PanelSerial } = require("./panelSerialModel");
const { CustomerDocument } = require("./customerDocumentModel");
const { CustomerDocumentFile } = require("./customerDocumentFileModel");

// ----------------------
// Customer → Lead
// Each Customer belongs to one Lead
Customer.belongsTo(Lead, { foreignKey: "lead_id", as: "lead" });

// ----------------------
// Customer → CustomerRegistration
// Each Customer has one Registration
Customer.hasOne(CustomerRegistration, {
  foreignKey: "customer_id",
  as: "registration",
});
CustomerRegistration.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

// ----------------------
// CustomerRegistration → PanelSerial
// One Registration has many Panels
CustomerRegistration.hasMany(PanelSerial, {
  foreignKey: "registration_id",
  as: "panels",
});
PanelSerial.belongsTo(CustomerRegistration, {
  foreignKey: "registration_id",
  as: "registration",
});

// ----------------------
// CustomerDocument → CustomerDocumentFile
// One Document has many Files
CustomerDocument.hasMany(CustomerDocumentFile, {
  foreignKey: "document_id",
  as: "files",
});
CustomerDocumentFile.belongsTo(CustomerDocument, {
  foreignKey: "document_id",
  as: "document",
});

// ----------------------
// Export all models
module.exports = {
  Customer,
  Lead,
  CustomerRegistration,
  PanelSerial,
  CustomerDocument,
  CustomerDocumentFile,
};
