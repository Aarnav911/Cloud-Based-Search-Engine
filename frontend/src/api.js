import { MOCK_DOCS } from "./mockData.js";

// true  -> built-in sample data, no backend needed
// false -> real Express API (proxied to http://localhost:3000 by Vite)
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// Documents added through the Admin page while in sample mode (lost on refresh).
let uploaded = [];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1);

// Simple stand-in for BM25 so the demo feels realistic.
function mockSearch({ q, course, semester, type }) {
  const terms = tokenize(q);
  return [...uploaded, ...MOCK_DOCS].filter(
    (d) =>
      (!course || d.course === course) &&
      (!semester || d.semester === semester) &&
      (!type || d.type === type)
  )
    .map((d) => {
      const text = tokenize(`${d.title} ${d.title} ${d.body}`);
      let score = 0;
      for (const t of terms) {
        const tf = text.filter((w) => w.startsWith(t)).length;
        if (tf) score += (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (text.length / 40)));
      }
      return { ...d, score: Number((score * 3).toFixed(2)) };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function searchDocuments(params) {
  if (USE_MOCK) {
    await wait(350);
    return mockSearch(params);
  }
  const qs = new URLSearchParams({ q: params.q });
  ["course", "semester", "type"].forEach((k) => params[k] && qs.set(k, params[k]));
  const res = await fetch(`/api/search?${qs}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "The search service returned an error.");
  }
  const { results } = await res.json();
  // Map the current backend shape ({ docId, score, title, body }) to the UI shape.
  return results.map((r) => ({
    id: r.docId,
    title: r.title,
    body: r.body || "",
    score: Number(r.score.toFixed(2)),
    course: r.course,
    semester: r.semester,
    type: r.type,
    pages: r.pages,
    url: r.url,
  }));
}

export async function uploadDocument({ file, title, course, semester, type }) {
  if (USE_MOCK) {
    await wait(900);
    const doc = {
      id: `u${Date.now()}`,
      title,
      course,
      semester,
      type,
      fileName: file.name,
      sizeKb: Math.round(file.size / 1024),
      body: `${title}. ${course} ${semester} ${type}. Uploaded file ${file.name}.`,
      url: URL.createObjectURL(file),
      status: "Indexed",
      uploadedAt: new Date().toISOString(),
    };
    uploaded = [doc, ...uploaded];
    return doc;
  }
  const form = new FormData();
  form.append("file", file);
  Object.entries({ title, course, semester, type }).forEach(([k, v]) => form.append(k, v));
  const res = await fetch("/api/documents", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed.");
  }
  return res.json();
}

export async function listUploads() {
  if (USE_MOCK) return uploaded;
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error("Could not load documents.");
  const { documents } = await res.json();
  return documents;
}
