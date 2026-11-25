import { useState } from "react";
import { searchDocuments } from "../api.js";
import { COURSES, SEMESTERS, TYPES } from "../mockData.js";
import Select from "../components/Select.jsx";
import ResultItem from "../components/ResultItem.jsx";

const SUGGESTIONS = ["deadlock", "normalization", "S3 storage", "congestion control"];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ course: "", semester: "", type: "" });
  const [state, setState] = useState({ status: "idle", results: [], query: "", error: "" });

  async function run(query = q, f = filters) {
    const text = query.trim();
    if (!text) return;
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const results = await searchDocuments({ q: text, ...f });
      setState({ status: "done", results, query: text, error: "" });
    } catch (err) {
      setState({ status: "error", results: [], query: text, error: err.message });
    }
  }

  const setFilter = (key) => (value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (state.status === "done" || state.status === "error") run(state.query, next);
  };

  const terms = state.query.toLowerCase().match(/[a-z0-9]+/g)?.filter((t) => t.length > 1) || [];
  const maxScore = state.results[0]?.score || 0;
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Find study material in seconds</h1>
          <p className="hero-sub">Search notes, past papers and lab manuals across your courses.</p>

          <form
            className="searchbar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M16 16l5 5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by topic, keyword or title"
              aria-label="Search documents"
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={!q.trim() || state.status === "loading"}>
              Search
            </button>
          </form>

          <div className="filters">
            <Select
              label="Course"
              value={filters.course}
              onChange={setFilter("course")}
              allLabel="All courses"
              options={COURSES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
            />
            <Select
              label="Semester"
              value={filters.semester}
              onChange={setFilter("semester")}
              allLabel="All semesters"
              options={SEMESTERS.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Document type"
              value={filters.type}
              onChange={setFilter("type")}
              allLabel="All types"
              options={TYPES.map((t) => ({ value: t, label: t }))}
            />
            {hasFilters && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  const cleared = { course: "", semester: "", type: "" };
                  setFilters(cleared);
                  if (state.query) run(state.query, cleared);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="container results" aria-live="polite">
        {state.status === "idle" && (
          <div className="empty">
            <p className="empty-title">Start with a topic</p>
            <p className="empty-text">Try one of these:</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setQ(s);
                    run(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.status === "loading" && (
          <div className="loading" role="status">
            <span className="spinner" aria-hidden="true" /> Searching…
          </div>
        )}

        {state.status === "error" && (
          <div className="notice notice-error" role="alert">
            <strong>Search failed.</strong> {state.error} Check that the backend is running on port 3000 and try again.
          </div>
        )}

        {state.status === "done" && state.results.length === 0 && (
          <div className="empty">
            <p className="empty-title">No documents match “{state.query}”</p>
            <p className="empty-text">Check the spelling, use a broader keyword, or clear your filters.</p>
          </div>
        )}

        {state.status === "done" && state.results.length > 0 && (
          <>
            <p className="results-count">
              {state.results.length} {state.results.length === 1 ? "result" : "results"} for “{state.query}”
            </p>
            <div className="result-list">
              {state.results.map((doc) => (
                <ResultItem key={doc.id} doc={doc} maxScore={maxScore} terms={terms} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
