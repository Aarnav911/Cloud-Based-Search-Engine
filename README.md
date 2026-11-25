# ScholarFind

Cloud-Based Academic Resource Search and Recommendation System (UCS531).
BM25 search over uploaded PDFs. Index in **Amazon DynamoDB**, files in **Amazon S3**.

```
ScholarFind/
  frontend/   React + Vite UI (search page + admin upload page)
  backend/    Node.js + Express API (BM25, PDF text extraction, DynamoDB, S3)
  docs/       DynamoDB schema notes
```

## 1. Try the UI only (no AWS)

Requires Node.js 18 or newer.

```bash
npm run setup
npm run dev
```

Open http://localhost:5173. The UI uses sample data until you switch it to the real API (step 3).

## 2. Connect AWS

1. **Credentials.** Install the AWS CLI and run `aws configure`, or put `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `backend/.env`. Never commit that file.
2. **Config.** Copy `backend/.env.example` to `backend/.env`. Set `AWS_REGION` and a globally unique `S3_BUCKET`.
3. **Create the table and bucket** (safe to run again):
   ```bash
   npm run setup:aws
   ```

## 3. Run with the real backend

1. In `frontend/.env`, set `VITE_USE_MOCK=false`.
2. From the project root: `npm run dev`
3. Open http://localhost:5173, go to **Admin**, upload a PDF, then search for a word from it.

The footer's "Showing sample data" note disappears once the real API is on.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/search?q=&course=&semester=&type=` | BM25 ranked results with a 15-minute PDF link |
| POST | `/api/documents` | Multipart: `file` (PDF), `title`, `course`, `semester`, `type` |
| GET | `/api/documents` | Recent uploads, newest first |
| GET | `/api/health` | Shows the configured table and bucket |

## Status

| Feature | Status |
| --- | --- |
| Search UI, filters, scores, highlighting | Done |
| PDF upload, text extraction, index update | Done |
| BM25 ranking on DynamoDB, course / semester / type filters | Done |
| PDFs in S3 with time-limited links | Done |
| Login for the admin page | To build |
| Delete a document | To build |
| Deploy to EC2 | To build |

See `docs/DYNAMODB_SCHEMA.md` for the table design and IAM permissions.
