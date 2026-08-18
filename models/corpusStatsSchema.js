const mongoose = require("mongoose");

const corpusStatsSchema = new mongoose.Schema({
  _id: { type: String, default: "corpusStats" }, // singleton document
  avgDocLen: { type: Number, required: true },
  docLengths: { type: Map, of: Number, required: true },
  totalDocs: { type: Number, required: true },
});

module.exports = mongoose.model("CorpusStats", corpusStatsSchema);
