// BM25 scoring (same formulas as the original controller), working on postings
// fetched from DynamoDB instead of an in-memory index.
const K1 = 1.5;
const B = 0.75;

function idf(totalDocs, docsWithTerm) {
  const n = Math.max(totalDocs, docsWithTerm);
  return Math.log((n - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
}

function tfComponent(tf, docLen, avgDocLen) {
  return (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (docLen / avgDocLen)));
}

// postingsByTerm: Map<term, posting[]>. Returns [{ docId, score }] best first.
// df comes from ALL postings, so filters never change a term's IDF.
function rank(postingsByTerm, { totalDocs, avgDocLen }, matchesFilters) {
  const scores = new Map();
  for (const postings of postingsByTerm.values()) {
    const termIdf = idf(totalDocs, postings.length);
    for (const p of postings) {
      if (!matchesFilters(p)) continue;
      const add = termIdf * tfComponent(p.tf, p.dl, avgDocLen);
      scores.set(p.docId, (scores.get(p.docId) || 0) + add);
    }
  }
  return [...scores]
    .map(([docId, score]) => ({ docId, score }))
    .sort((a, b) => b.score - a.score);
}

module.exports = { rank };
