require("dotenv").config();
const express = require("express");

const searchRoutes = require("./routes/searchRoutes");
const connectToMongoDB = require("./utils/connectToDb");

const app = express();
const PORT = process.env.PORT || 3001;

app.use("/api", searchRoutes);

async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
}
startServer();
