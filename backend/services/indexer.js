const crypto = require("crypto");
const { processedText } = require("../utils/textProcessing");
const { extractPdfText } = require("./pdf");
const { putPdf, deletePdf } = require("./storage");
const { saveDocument, removeDocumentItems } = require("./dynamo");
const HttpError = require("../utils/httpError");

const MAX_STORED_TEXT = 30000; // characters kept for result snippets

async function indexDocument({ buffer, fileName, title, course, semester, type }) {
  const { text, pages } = await extractPdfText(buffer);
  const cleanText = text.replace(/\s+/g, " ").trim();

  // Same preprocessing as the query side: lowercase, stopwords, Porter stemming.
  const tokens = processedText(`${title} ${cleanText}`).filter(
    (t) => t.length >= 2 && t.length <= 40,
  );
  if (tokens.length < 5) {
    throw new HttpError(
      422,
      "No readable text was found in this PDF. Scanned documents need OCR first.",
    );
  }

  const termCounts = new Map();
  for (const t of tokens) termCounts.set(t, (termCounts.get(t) || 0) + 1);

  const docId = crypto.randomUUID();
  const s3Key = `documents/${docId}.pdf`;
  const meta = {
    docId,
    title,
    course,
    semester,
    type,
    fileName,
    s3Key,
    pages,
    docLen: tokens.length,
    text: cleanText.slice(0, MAX_STORED_TEXT),
    createdAt: new Date().toISOString(),
  };

  await putPdf(s3Key, buffer);
  try {
    await saveDocument(meta, termCounts);
  } catch (err) {
    await Promise.allSettled([
      deletePdf(s3Key),
      removeDocumentItems(docId, [...termCounts.keys()]),
    ]);
    throw err;
  }

  return {
    id: docId,
    title,
    course,
    semester,
    type,
    fileName,
    pages,
    status: "Indexed",
    createdAt: meta.createdAt,
  };
}

module.exports = { indexDocument };
