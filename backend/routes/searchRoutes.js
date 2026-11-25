const express = require("express");
const multer = require("multer");
const { searchDocuments } = require("../services/search");
const { indexDocument } = require("../services/indexer");
const { listDocuments } = require("../services/dynamo");
const HttpError = require("../utils/httpError");
const cfg = require("../config");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: cfg.maxUploadMb * 1024 * 1024, files: 1 },
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", table: cfg.table, bucket: cfg.bucket });
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) throw new HttpError(400, "Query parameter 'q' is required.");
  const { course, semester, type } = req.query;
  const results = await searchDocuments(q, { course, semester, type });
  res.json({ results });
});

router.post("/documents", upload.single("file"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "Attach a PDF file.");
  const title = String(req.body.title || "").trim();
  const course = String(req.body.course || "").trim();
  const semester = String(req.body.semester || "").trim();
  const type = String(req.body.type || "").trim();
  if (!title || !course || !semester || !type) {
    throw new HttpError(400, "Title, course, semester and type are all required.");
  }
  const doc = await indexDocument({
    buffer: req.file.buffer,
    fileName: req.file.originalname,
    title,
    course,
    semester,
    type,
  });
  res.status(201).json(doc);
});

router.get("/documents", async (req, res) => {
  const items = await listDocuments();
  res.json({
    documents: items.map((d) => ({
      id: d.docId,
      title: d.title,
      course: d.course,
      semester: d.semester,
      type: d.type,
      fileName: d.fileName,
      pages: d.pages,
      status: d.status,
      createdAt: d.createdAt,
    })),
  });
});

module.exports = router;
