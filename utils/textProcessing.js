const natural = require("natural");

function cleanText(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "");
}

function tokenize(text) {
  const cleanedText = cleanText(text);
  return cleanedText.split(/\s+/).filter((word) => word.length > 0);
}

const stopwords = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "this",
  "that",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "and",
  "or",
  "but",
  "from",
  "with",
  "as",
  "by",
  "be",
  "been",
  "has",
  "have",
]);

function removeStopwords(tokens) {
  return tokens.filter((word) => !stopwords.has(word));
}

function stemTokens(tokens) {
  return tokens.map((word) => natural.PorterStemmer.stem(word));
}

function processedText(text) {
  const tokens = tokenize(text);
  const tokensWithoutStopwords = removeStopwords(tokens);
  const stemmedTokens = stemTokens(tokensWithoutStopwords);
  return stemmedTokens;
}

module.exports = {
  cleanText,
  tokenize,
  removeStopwords,
  stemTokens,
  processedText,
};
