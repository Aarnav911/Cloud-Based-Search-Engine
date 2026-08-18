const Document = require("../models/documentSchema");
const axios = require("axios");

async function ingest() {
  const response = await axios.get(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  );
  const topIds = response.data;
  for (let i = 0; i < 1000; i++) {
    const id = topIds[i];
    try {
      const itemResponse = await axios.get(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      const item = itemResponse.data;
      if (!item || !item.title) {
        continue;
      }
      await Document.updateOne(
        { sourceId: String(id) },
        {
          sourceId: String(id),
          title: item.title,
          url: item.url || "",
          body: item.text || "",
          createdAt: new Date(item.time * 1000),
        },
        { upsert: true },
      );
      console.log("Saved: ", item.title);
    } catch (error) {
      console.error("Error fetching item with id:", id, error.message);
    }
  }
  console.log("Ingestion complete");
}

module.exports = ingest;
