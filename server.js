const express = require("express");
const app = express();

const UserSeeder = require("./Seeder/UserSeed");
const userRoutes = require("./routes/userRoutes");

UserSeeder.startServer();
app.use(express.json());
app.use("/api/users", userRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
