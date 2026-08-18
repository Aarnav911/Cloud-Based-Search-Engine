const Document = require("../models/documentSchema");
const { rankDocuments } = require("./bm25Controller");
const { processedText } = require("../utils/textProcessing");
const { saveInvertedIndex, saveCorpusStats } = require("./indexController");

function buildIndexAndDocStats(documents) {
  const index = new Map(); //this is inverted index
  const docLengths = new Map(); //this is a map of docId to document length
  let totalLength = 0;

  for (const doc of documents) {
    const fullText = doc.title + " " + doc.body;
    const tokens = processedText(fullText); //this is an array of tokens
    const docId = String(doc._id);

    docLengths.set(docId, tokens.length); //this is the length of the document in terms of number of tokens
    totalLength += tokens.length;

    for (const token of tokens) {
      if (!index.has(token)) {
        index.set(token, new Map());
      }
      const docCounts = index.get(token);
      const currentCount = docCounts.get(docId) || 0;
      docCounts.set(docId, currentCount + 1);
    }
  }

  const avgDocLen = totalLength / documents.length;

  return { index, docLengths, avgDocLen };
}

async function processDocuments() {
  const documents = await Document.find();
  console.log(`Processing ${documents.length} documents...`);

  const {
    index: invertedIndex,
    docLengths,
    avgDocLen,
  } = buildIndexAndDocStats(documents);

  await saveInvertedIndex(invertedIndex);
  await saveCorpusStats(avgDocLen, docLengths, documents.length);

  const results = rankDocuments(
    "hacker news",
    invertedIndex,
    documents.length,
    avgDocLen,
    docLengths,
  );
  console.log("Search results for 'hacker news':", results.slice(0, 5));

  console.log("Done processing documents and saving inverted index.");
}

module.exports = processDocuments;
