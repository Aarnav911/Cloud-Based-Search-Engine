const express = require("express");
const multer = require("multer");
const cfg = require("./config");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
app.use(express.json());
app.use("/api", searchRoutes);
const path = require("path");
const dist = path.join(__dirname, "../frontend/dist");
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(dist, "index.html")),
);

// Turns thrown errors into JSON the frontend can show.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({
      error: tooBig
        ? `The PDF is larger than ${cfg.maxUploadMb} MB.`
        : err.message,
    });
  }
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  const hint =
    err.name === "ResourceNotFoundException"
      ? "DynamoDB table not found. Run: npm run setup:aws"
      : err.name === "NoSuchBucket"
        ? "S3 bucket not found. Check S3_BUCKET and run: npm run setup:aws"
        : "Something went wrong on the server.";
  res.status(500).json({ error: hint });
});

if (require.main === module) {
  if (!cfg.bucket) {
    console.error(
      "S3_BUCKET is not set. Copy .env.example to .env and fill it in.",
    );
    process.exit(1);
  }
  app.listen(cfg.port, () => {
    console.log(`API running at http://localhost:${cfg.port}`);
    console.log(
      `DynamoDB table: ${cfg.table} | S3 bucket: ${cfg.bucket} | region: ${cfg.region}`,
    );
  });
}

module.exports = app;
