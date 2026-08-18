const { processedText } = require("../utils/textProcessing");

function calculateIDF(term, totalDocs, docsContainingTerm) {
  return Math.log(
    (totalDocs - docsContainingTerm + 0.5) / (docsContainingTerm + 0.5) + 1,
  );
}
function calculateTFComponent(f, docLen, avgDocLen, k1 = 1.5, b = 0.75) {
  const numerator = f * (k1 + 1);
  const denominator = f + k1 * (1 - b + b * (docLen / avgDocLen));
  return numerator / denominator;
}
function calculateBM25Score(
  queryTerms,
  docId,
  index,
  totalDocs,
  avgDocLen,
  docLengths,
) {
  let score = 0;

  for (const term of queryTerms) {
    if (!index.has(term)) continue;

    const termData = index.get(term);
    if (!termData.has(docId)) continue;

    const f = termData.get(docId); //this is the term frequency of the term in the document
    const docsContainingTerm = termData.size; //this is the number of documents that contain the term
    const docLen = docLengths.get(docId); //this is the length of the document in terms of number of tokens

    const idf = calculateIDF(term, totalDocs, docsContainingTerm);
    const tfComponent = calculateTFComponent(f, docLen, avgDocLen);

    score += idf * tfComponent;
  }

  return score;
}

function rankDocuments(queryText, index, totalDocs, avgDocLen, docLengths) {
  const queryTerms = processedText(queryText);

  const candidateDocIds = new Set();
  for (const term of queryTerms) {
    if (!index.has(term)) continue;
    const termData = index.get(term);
    for (const docId of termData.keys()) {
      candidateDocIds.add(docId);
    }
  }

  const results = [];
  for (const docId of candidateDocIds) {
    const score = calculateBM25Score(
      queryTerms,
      docId,
      index,
      totalDocs,
      avgDocLen,
      docLengths,
    );
    results.push({ docId, score });
  }

  results.sort((a, b) => b.score - a.score);

  return results;
}
module.exports = { rankDocuments };
