// Text extraction with pdf.js (pure JavaScript, no native add-ons).
const HttpError = require("../utils/httpError");

// pdf.js prints harmless "cannot polyfill DOMMatrix" warnings when it loads
// without the optional canvas package. We only read text, so hide them.
const realLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === "string" && args[0].startsWith("Warning: Cannot polyfill")) return;
  realLog(...args);
};
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
console.log = realLog;

async function extractPdfText(buffer) {
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new HttpError(400, "That file is not a valid PDF.");
  }
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      verbosity: 0,
    }).promise;
    const parts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((item) => item.str).join(" "));
    }
    return { text: parts.join("\n"), pages: doc.numPages };
  } catch (err) {
    const message =
      err.name === "PasswordException"
        ? "This PDF is password protected. Remove the password and upload it again."
        : "The PDF could not be read. It may be damaged.";
    throw new HttpError(422, message);
  } finally {
    if (doc) await doc.destroy();
  }
}

module.exports = { extractPdfText };
