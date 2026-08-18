require("dotenv").config();
const connectToMongoDB = require("./utils/connectToDb");
const processDocuments = require("./controllers/textProcessorController");

async function run() {
  await connectToMongoDB();
  await processDocuments();
  process.exit(0);
}
run();
