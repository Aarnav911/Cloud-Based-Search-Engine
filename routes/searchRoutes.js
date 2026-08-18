const express = require("express");
const router = express.Router();
const { searchDocuments } = require("../controllers/searchController");

router.get("/search", async (req, res) => {
  const queryText = req.query.q;

  if (!queryText || queryText.trim() === "") {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  try {
    const results = await searchDocuments(queryText);
    res.json({ results });
  } catch (error) {
    console.error("Error occurred while searching documents:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching documents." });
  }
});

module.exports = router;
