import { useEffect, useRef, useState } from "react";
import { listUploads, uploadDocument } from "../api.js";
import { COURSES, SEMESTERS, TYPES } from "../mockData.js";
import Select from "../components/Select.jsx";

const EMPTY = { title: "", course: "", semester: "", type: "" };

export default function AdminPage() {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploads, setUploads] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    listUploads().then(setUploads).catch(() => {});
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const ready = file && form.title.trim() && form.course && form.semester && form.type;

  function pick(f) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setMessage({ kind: "error", text: "Only PDF files are supported." });
      return;
    }
    setMessage(null);
    setFile(f);
    if (!form.title) setForm((s) => ({ ...s, title: f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ") }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setMessage(null);
    try {
      await uploadDocument({ file, ...form, title: form.title.trim() });
      setUploads(await listUploads());
      setMessage({ kind: "success", text: `“${form.title.trim()}” was uploaded and added to the search index.` });
      setForm(EMPTY);
      setFile(null);
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container admin">
      <div className="page-head">
        <h1>Upload documents</h1>
        <p>Add a PDF. Its text is extracted and made searchable automatically.</p>
      </div>

      <div className="admin-grid">
        <form className="panel" onSubmit={submit}>
          <div
            className={`dropzone ${dragging ? "is-drag" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files[0]);
            }}
          >
            <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files[0])} />
            {file ? (
              <>
                <p className="dz-title">{file.name}</p>
                <p className="dz-text">{(file.size / 1024).toFixed(0)} KB</p>
                <button type="button" className="link-btn" onClick={() => { setFile(null); inputRef.current.value = ""; }}>
                  Remove file
                </button>
              </>
            ) : (
              <>
                <p className="dz-title">Drag a PDF here</p>
                <p className="dz-text">or</p>
                <button type="button" className="btn btn-outline" onClick={() => inputRef.current.click()}>
                  Choose file
                </button>
              </>
            )}
          </div>

          <label className="field">
            <span className="field-label">Title</span>
            <input type="text" value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Amazon S3 and Object Storage" />
          </label>

          <div className="form-row">
            <Select label="Course" value={form.course} onChange={set("course")} allLabel="Select course" options={COURSES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))} />
            <Select label="Semester" value={form.semester} onChange={set("semester")} allLabel="Select semester" options={SEMESTERS.map((s) => ({ value: s, label: s }))} />
            <Select label="Document type" value={form.type} onChange={set("type")} allLabel="Select type" options={TYPES.map((t) => ({ value: t, label: t }))} />
          </div>

          {message && (
            <div className={`notice ${message.kind === "error" ? "notice-error" : "notice-success"}`} role={message.kind === "error" ? "alert" : "status"}>
              {message.text}
            </div>
          )}

          <button className="btn btn-primary btn-wide" type="submit" disabled={!ready || busy}>
            {busy ? "Uploading and indexing…" : "Upload and index"}
          </button>
        </form>

        <div className="panel">
          <h2 className="panel-title">Recent uploads</h2>
          {uploads.length === 0 ? (
            <p className="empty-text">Nothing uploaded yet. Documents you add will appear here.</p>
          ) : (
            <ul className="upload-list">
              {uploads.map((u) => (
                <li key={u.id}>
                  <div>
                    <p className="upload-title">{u.title}</p>
                    <p className="upload-meta">
                      {u.course} · {u.semester} · {u.type}
                    </p>
                  </div>
                  <span className="status">{u.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
