const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const connectToMongoDB = require("./utils/connectToDb");
const ingest = require("./controllers/ingestController");

async function run() {
  await connectToMongoDB();
  await ingest();
  process.exit(0);
}

run();
