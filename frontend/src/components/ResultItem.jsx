import { COURSES } from "../mockData.js";

function highlight(text, terms) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

function snippet(body, terms) {
  if (!body) return "";
  const lower = body.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, hit - 60);
  const text = body.slice(start, start + 220).trim();
  return `${start > 0 ? "…" : ""}${text}${start + 220 < body.length ? "…" : ""}`;
}

export default function ResultItem({ doc, maxScore, terms }) {
  const courseName = COURSES.find((c) => c.code === doc.course)?.name;
  const pct = maxScore ? Math.max(8, Math.round((doc.score / maxScore) * 100)) : 0;

  return (
    <article className="result">
      <div className="result-main">
        <h3 className="result-title">{highlight(doc.title, terms)}</h3>
        <p className="result-meta">
          {doc.course && (
            <span className="tag tag-course">
              {doc.course}
              {courseName ? ` · ${courseName}` : ""}
            </span>
          )}
          {doc.semester && <span className="tag">{doc.semester}</span>}
          {doc.type && <span className="tag">{doc.type}</span>}
          {doc.pages && <span className="meta-text">{doc.pages} pages</span>}
        </p>
        <p className="result-snippet">{highlight(snippet(doc.body, terms), terms)}</p>
      </div>
      <div className="result-side">
        <div className="score" title="BM25 relevance score">
          <span className="score-label">Relevance</span>
          <span className="score-value">{doc.score}</span>
          <span className="score-bar">
            <span style={{ width: `${pct}%` }} />
          </span>
        </div>
        {doc.url ? (
          <a className="btn btn-outline" href={doc.url} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        ) : (
          <button className="btn btn-outline" type="button" disabled title="Sample document, no PDF attached">
            Open PDF
          </button>
        )}
      </div>
    </article>
  );
}
