const express = require("express");
const cors = require("cors");
const app = express();

const UserSeeder = require("./Seeder/UserSeed");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const sourceRoutes = require("./routes/sourceRoute");
const customerRoutes = require("./routes/customerRoutes");
const docCollectRoutes = require("./routes/docCollectRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const nameChangeRoutes = require("./routes/nameChangeRoute");
const kitReadyRoutes = require("./routes/kitReadyRoutes");
const loanRoutes = require("./routes/loanRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const wiringhRoutes = require("./routes/wiringRoutes");
require("./models/associationModel");
UserSeeder.startServer();
app.use(express.json());
app.use(cors({ origin: "https://bh-square-frontend.vercel.app" }));
// app.use(cors({ origin: "http://localhost:5173" }));
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/sources", sourceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/docs", docCollectRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/namechange", nameChangeRoutes);
app.use("/api/kitready", kitReadyRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/wiring", wiringhRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
