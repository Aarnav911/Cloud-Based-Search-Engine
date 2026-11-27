// backend/scripts/bulkIndex.js
// One-off script: index every PDF already sitting in the S3 bucket.
// Run from the backend folder:  node scripts/bulkIndex.js
// Safe to re-run: documents already in DynamoDB (matched by s3Key) are skipped.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

// ---- 1. ADJUST THESE IMPORTS TO MATCH YOUR FILES ---------------------------
const clients = require("../services/clients"); // expected: s3 client + dynamo doc client
const config = require("../config"); // expected: bucket + table names
const indexer = require("../services/indexer"); // your existing indexing logic

const s3 = clients.s3 || clients.s3Client;
const docClient =
  clients.docClient || clients.dynamoDoc || clients.ddbDocClient;
const BUCKET = config.s3Bucket || config.S3_BUCKET || process.env.S3_BUCKET;
const DOCS_TABLE =
  config.documentsTable ||
  config.DOCUMENTS_TABLE ||
  process.env.DOCUMENTS_TABLE;

// Wrap your existing upload-time indexing here. This is the ONE function that
// must match your indexer.js. It receives the PDF as a Buffer plus metadata and
// must: extract text, tokenize, write the Documents row + Index postings.
async function indexOne(buffer, s3Key, meta) {
  // Replace with whatever indexer.js actually exports, e.g.:
  // return indexer.indexDocument({ buffer, s3Key, ...meta });
  return indexer.indexDocument({
    buffer,
    s3Key,
    ...meta,
    skipStatsRefresh: true,
  });
}

// Called once at the end (recompute avgdl + doc count) if your indexer has it.
async function refreshStats() {
  if (typeof indexer.recomputeStats === "function")
    return indexer.recomputeStats();
  if (typeof indexer.updateStats === "function") return indexer.updateStats();
  console.warn(
    "No stats function found in indexer.js. Recompute avgdl/doc count yourself.",
  );
}
// ----------------------------------------------------------------------------

const CONCURRENCY = 4;
const FAILED_FILE = path.join(__dirname, "bulkIndex.failed.txt");

// Turn "CS101/sem3/notes/file.pdf" into metadata. Adjust to your key layout.
function metaFromKey(key) {
  const parts = key.split("/");
  const file = parts[parts.length - 1];
  const title = file
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const meta = { title, course: "", semester: "", type: "" };
  if (parts.length >= 4) {
    meta.course = parts[0];
    meta.semester = parts[1];
    meta.type = parts[2];
  } else if (parts.length === 2) {
    meta.course = parts[0];
  }
  return meta;
}

async function listAllPdfKeys() {
  const keys = [];
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }),
    );
    for (const obj of res.Contents || []) {
      if (/\.pdf$/i.test(obj.Key)) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function loadIndexedKeys() {
  const seen = new Set();
  let startKey;
  do {
    const res = await docClient.send(
      new ScanCommand({
        TableName: DOCS_TABLE,
        ProjectionExpression: "s3Key",
        ExclusiveStartKey: startKey,
      }),
    );
    for (const item of res.Items || []) if (item.s3Key) seen.add(item.s3Key);
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return seen;
}

async function downloadObject(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function processKey(key, stats) {
  try {
    const buffer = await downloadObject(key);
    await indexOne(buffer, key, metaFromKey(key));
    stats.done++;
  } catch (err) {
    stats.failed++;
    fs.appendFileSync(FAILED_FILE, `${key}\t${err.message}\n`);
    console.error(`FAILED ${key}: ${err.message}`);
  }
  const total = stats.done + stats.failed;
  if (total % 25 === 0)
    console.log(`Progress: ${total}/${stats.total} (failed: ${stats.failed})`);
}

async function main() {
  if (!BUCKET || !DOCS_TABLE)
    throw new Error(
      "Bucket or Documents table name not resolved. Check config.js / .env",
    );

  console.log("Listing bucket...");
  const allKeys = await listAllPdfKeys();
  console.log(`Found ${allKeys.length} PDFs in S3`);

  console.log("Loading already-indexed documents...");
  const indexed = await loadIndexedKeys();
  const todo = allKeys.filter((k) => !indexed.has(k));
  console.log(`Already indexed: ${indexed.size}. To index now: ${todo.length}`);

  const stats = { done: 0, failed: 0, total: todo.length };
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < todo.length) {
      const key = todo[i++];
      await processKey(key, stats);
    }
  });
  await Promise.all(workers);

  await refreshStats();
  console.log(`Done. Indexed: ${stats.done}, failed: ${stats.failed}`);
  if (stats.failed) console.log(`Failed keys written to ${FAILED_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
