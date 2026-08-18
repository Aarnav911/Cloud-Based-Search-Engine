const InvertedIndex = require("../models/invertedIndexSchema");
const CorpusStats = require("../models/corpusStatsSchema");

// Saves the inverted index to MongoDB. For each term, upserts a document
// containing the list of matching document IDs and their real term frequencies.
async function saveInvertedIndex(index) {
  for (const [term, docCounts] of index) {
    await InvertedIndex.updateOne(
      { term },
      {
        term,
        documentIds: Array.from(docCounts.keys()),
        termFrequency: Object.fromEntries(docCounts),
      },
      { upsert: true },
    );
  }
  console.log("Inverted index saved to MongoDB");
}

// Reconstructs the in-memory inverted index (Map<term, Map<docId, freq>>)
// from the InvertedIndex collection in MongoDB.
async function loadInvertedIndexFromDB() {
  const entries = await InvertedIndex.find();
  const index = new Map();

  for (const entry of entries) {
    const docCounts = new Map(entry.termFrequency);
    index.set(entry.term, docCounts);
  }

  console.log(`Loaded inverted index with ${index.size} terms from MongoDB`);
  return index;
}

async function saveCorpusStats(avgDocLen, docLengths, totalDocs) {
  await CorpusStats.updateOne(
    { _id: "corpusStats" },
    {
      avgDocLen,
      docLengths: Object.fromEntries(docLengths),
      totalDocs,
    },
    { upsert: true },
  );
  console.log("Corpus stats saved to MongoDB");
}

async function loadCorpusStats() {
  const stats = await CorpusStats.findById("corpusStats");
  if (!stats) return null;

  const docLengths = new Map(
    Object.entries(Object.fromEntries(stats.docLengths)),
  );
  console.log(
    `Loaded corpus stats: avgDocLen=${stats.avgDocLen}, totalDocs=${stats.totalDocs}`,
  );
  return {
    avgDocLen: stats.avgDocLen,
    docLengths,
    totalDocs: stats.totalDocs,
  };
}

module.exports = {
  saveInvertedIndex,
  loadInvertedIndexFromDB,
  saveCorpusStats,
  loadCorpusStats,
};
