const mongoose = require("mongoose");
const documentSchema = new mongoose.Schema({
  sourceId: { type: String, unique: true },
  title: String,
  url: String,
  body: String,
  createdAt: Date,
});
const Document = mongoose.model("Document", documentSchema);
module.exports = Document;
