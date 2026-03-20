// models/associationModel.js

const { Customer } = require("./customerModel");
const { Lead } = require("./leadModel");
const { CustomerRegistration } = require("./customerRegistrationModel");
const { PanelSerial } = require("./panelSerialModel");
const { CustomerDocument } = require("./customerDocumentModel");
const { CustomerDocumentFile } = require("./customerDocumentFileModel");
const { FileGeneration } = require("./fileGenerationModel"); // ✅ Import FileGeneration
const { KitReady } = require("../models/kitReadyModel");
const { Loan } = require("../models/loanModel");
const { LoanDoc } = require("../models/loanDocModel");
const { Brand } = require("../models/brandModel");
const { Inventory } = require("../models/inventoryModel");
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
// Associations
FileGeneration.belongsTo(CustomerRegistration, {
  foreignKey: "registration_id",
  as: "registration",
});

CustomerRegistration.hasOne(FileGeneration, {
  foreignKey: "registration_id",
  as: "file_generation",
});
KitReady.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

Customer.hasOne(KitReady, {
  foreignKey: "customer_id",
  as: "kit_ready",
});

// Associations
Loan.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Customer.hasMany(Loan, { foreignKey: "customer_id", as: "loans" });

// Associations
LoanDoc.belongsTo(Loan, { foreignKey: "loan_id", as: "loan" });
Loan.hasMany(LoanDoc, { foreignKey: "loan_id", as: "documents" });

FileGeneration.belongsTo(Brand, {
  foreignKey: "panel_brand_id",
  as: "panelBrand",
});

FileGeneration.belongsTo(Brand, {
  foreignKey: "inverter_brand_id",
  as: "inverterBrand",
});

Inventory.belongsTo(Brand, {
  foreignKey: "brand_id",
  as: "brand",
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
  FileGeneration,
  Loan,
  LoanDoc,
  Brand,
  Inventory,
};
