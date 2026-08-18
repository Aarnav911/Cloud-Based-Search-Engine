const {
  loadInvertedIndexFromDB,
  loadCorpusStats,
} = require("./indexController");

const { rankDocuments } = require("./bm25Controller");
const Document = require("../models/documentSchema");

async function searchDocuments(queryText) {
  const invertedIndex = await loadInvertedIndexFromDB();

  const { avgDocLen, docLengths, totalDocs } = await loadCorpusStats();

  const ranked = rankDocuments(
    queryText,
    invertedIndex,
    totalDocs,
    avgDocLen,
    docLengths,
  );

  const docIds = ranked.map((r) => r.docId);

  const docs = await Document.find({ _id: { $in: docIds } });

  const docMap = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  const results = ranked
    .map((r) => {
      const doc = docMap.get(r.docId.toString());
      if (!doc) return null;

      return {
        docId: r.docId,
        score: r.score,
        title: doc.title,
        body: doc.body,
      };
    })
    .filter(Boolean);

  return results;
}

module.exports = { searchDocuments };
