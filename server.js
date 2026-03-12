const express = require("express");
const cors = require("cors");
const app = express();

const UserSeeder = require("./Seeder/UserSeed");
const userRoutes = require("./routes/userRoutes");

UserSeeder.startServer();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use("/api/users", userRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
