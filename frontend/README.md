# ScholarFind frontend

React + Vite frontend for the Cloud-Based Academic Resource Search system.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Pages

- **Search** (`#/`): search box, course / semester / type filters, ranked results with BM25 scores.
- **Admin** (`#/admin`): PDF upload form and recent uploads list.

## Sample data vs. real backend

`.env` controls the data source:

- `VITE_USE_MOCK=true`: built-in sample documents, no backend needed.
- `VITE_USE_MOCK=false`: calls the Express API. Vite proxies `/api` to `http://localhost:3000`.

All network calls live in `src/api.js`. Endpoints the UI expects:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/search?q=&course=&semester=&type=` | Returns `{ results: [{ docId, score, title, body, course?, semester?, type?, pages?, url? }] }` |
| POST | `/api/documents` | Multipart: `file`, `title`, `course`, `semester`, `type`. Implemented in the backend. |
| GET | `/api/documents` | Returns `{ documents: [...] }`. Implemented in the backend. |

## Structure

```
src/
  api.js              all backend calls (+ sample-data mode)
  mockData.js         courses, semesters, types, sample documents
  App.jsx             header, navigation, page switching
  pages/              SearchPage, AdminPage
  components/         ResultItem, Select
  styles.css          blue and white theme (colors are CSS variables at the top)
```
