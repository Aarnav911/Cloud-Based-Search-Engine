const mongoose = require("mongoose");
const invertedIndexSchema = new mongoose.Schema({
  term: { type: String, unique: true },
  documentIds: [String],
  termFrequency: { type: Map, of: Number }, // Map of documentId to term frequency
});
const InvertedIndex = mongoose.model("InvertedIndex", invertedIndexSchema);
module.exports = InvertedIndex;
