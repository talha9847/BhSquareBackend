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
const { KitItems } = require("../models/kitItemsModels");
const { InverterSerial } = require("./inverterSerialModel");
const { Dispatch } = require("./dispatchModel");
const { Fabrication } = require("./fabricationModel");
const { Fabricator } = require("./fabricatorModel");
const { Wiring } = require("./wiringModel");
const { Technician } = require("./technicianModel");
const { Car } = require("./carModel");
const { Driver } = require("./driverModel");
const { WiringItem } = require("./wiringItemModel");
const { WireInventory } = require("./wireInventoryModel");
const { WiringDocs } = require("./wiringDocModel");
const { CustomerStage } = require("./customerStageModel");
const { Stage } = require("./stegeModel");
const { Source } = require("./sourceModel");
const { Category } = require("./categoryModel");
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
Customer.hasMany(PanelSerial, {
  foreignKey: "customer_id",
  as: "panels",
});
PanelSerial.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customers",
});

Customer.hasMany(InverterSerial, {
  foreignKey: "customer_id",
  as: "inverters",
});

InverterSerial.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customers",
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

KitReady.hasMany(KitItems, {
  foreignKey: "kit_id",
  as: "items",
});

// Each item belongs to one kit
KitItems.belongsTo(KitReady, {
  foreignKey: "kit_id",
  as: "kit",
});

Inventory.hasMany(KitItems, {
  foreignKey: "inventory_id",
  as: "kitItems",
});

KitItems.belongsTo(Inventory, {
  foreignKey: "inventory_id",
  as: "inventory",
});

// Dispatch -> Customer
Dispatch.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Fabrication.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Customer.hasMany(Fabrication, {
  foreignKey: "customer_id",
  as: "fabrications",
});

// Fabrication → Fabricator
Fabrication.belongsTo(Fabricator, {
  foreignKey: "fabricator_id",
  as: "fabricator",
});
Fabricator.hasMany(Fabrication, {
  foreignKey: "fabricator_id",
  as: "fabrications",
});

Wiring.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customerForWiring", // used in include
});

// Customer → Wiring (also with alias)
Customer.hasMany(Wiring, {
  foreignKey: "customer_id",
  as: "wiringRecords", // alias for Customer -> all wirings
});

Wiring.belongsTo(Technician, { foreignKey: "technician_id", as: "technician" });

// 🔹 Dispatch → Driver
Dispatch.belongsTo(Driver, {
  foreignKey: "driver_id",
  as: "driver",
  onDelete: "CASCADE",
});

// 🔹 Driver → Dispatch
Driver.hasMany(Dispatch, {
  foreignKey: "driver_id",
  as: "dispatches",
});

// 🔹 Dispatch → Car
Dispatch.belongsTo(Car, {
  foreignKey: "car_id",
  as: "car",
  onDelete: "CASCADE",
});

// 🔹 Car → Dispatch
Car.hasMany(Dispatch, {
  foreignKey: "car_id",
  as: "dispatches",
});

// WiringItem → Wiring
WiringItem.belongsTo(WireInventory, {
  foreignKey: "wire_inventory_id",
  as: "wire", // ✅ this alias must be used in the include
  onDelete: "CASCADE",
});
WireInventory.hasMany(WiringItem, {
  foreignKey: "wire_inventory_id",
  as: "wiring_items",
});

// --- Wiring → WiringItem
WiringItem.belongsTo(Wiring, {
  foreignKey: "wiring_id",
  as: "wiring",
  onDelete: "CASCADE",
});
Wiring.hasMany(WiringItem, {
  foreignKey: "wiring_id",
  as: "items",
});

WiringDocs.belongsTo(Wiring, {
  foreignKey: "wiring_id",
  as: "wiring",
  onDelete: "CASCADE",
});

Wiring.hasMany(WiringDocs, {
  foreignKey: "wiring_id",
  as: "docs",
});

CustomerStage.belongsTo(Stage, {
  foreignKey: "stage_id",
  as: "stage", // this is the alias you will use in includes
});

// Optional: Stage has many customer stages
Stage.hasMany(CustomerStage, {
  foreignKey: "stage_id",
  as: "customer_stages",
});

Lead.belongsTo(Source, {
  foreignKey: "source_id",
  as: "source",
});

// Optional (reverse)
Source.hasMany(Lead, {
  foreignKey: "source_id",
  as: "leads",
});

Inventory.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Customer -> Lead
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
  KitItems,
  InverterSerial,
  Dispatch,
  Fabrication,
  Fabricator,
  Wiring,
  Technician,
  Driver,
  Car,
  WireInventory,
  WiringItem,
  CustomerStage,
  Stage,
};
