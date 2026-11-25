const natural = require("natural");
const { processedText } = require("../utils/textProcessing");
const { rank } = require("./bm25");
const { getCorpusStats, getPostings, getDocuments } = require("./dynamo");
const { signedPdfUrl } = require("./storage");
const { maxResults } = require("../config");

function makeSnippet(text, queryTerms, length = 300) {
  if (!text) return "";
  const wanted = new Set(queryTerms);
  let start = 0;
  const words = /[A-Za-z0-9]+/g;
  let m;
  while ((m = words.exec(text))) {
    if (wanted.has(natural.PorterStemmer.stem(m[0].toLowerCase()))) {
      start = Math.max(0, m.index - 80);
      break;
    }
  }
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < start + 20) start = space + 1;
  }
  return text.slice(start, start + length);
}

async function searchDocuments(queryText, { course, semester, type } = {}) {
  const queryTerms = [...new Set(processedText(queryText))];
  if (queryTerms.length === 0) return [];

  const stats = await getCorpusStats();
  if (stats.totalDocs === 0) return [];

  const lists = await Promise.all(queryTerms.map((t) => getPostings(t)));
  const postingsByTerm = new Map(queryTerms.map((t, i) => [t, lists[i]]));

  const ranked = rank(
    postingsByTerm,
    stats,
    (p) =>
      (!course || p.course === course) &&
      (!semester || p.semester === semester) &&
      (!type || p.type === type),
  ).slice(0, maxResults);
  if (ranked.length === 0) return [];

  const docs = await getDocuments(
    ranked.map((r) => r.docId),
    ["docId", "title", "course", "semester", "type", "pages", "s3Key", "text"],
  );

  const results = await Promise.all(
    ranked.map(async (r) => {
      const doc = docs.get(r.docId);
      if (!doc) return null;
      return {
        docId: r.docId,
        score: r.score,
        title: doc.title,
        body: makeSnippet(doc.text, queryTerms),
        course: doc.course,
        semester: doc.semester,
        type: doc.type,
        pages: doc.pages,
        url: await signedPdfUrl(doc.s3Key),
      };
    }),
  );
  return results.filter(Boolean);
}

module.exports = { searchDocuments };
