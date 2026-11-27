# ScholarFind

Cloud-Based Academic Resource Search Engine Using BM25 (UCS531 Cloud Computing, Thapar Institute of Engineering and Technology, Patiala).

Students search a collection of academic PDFs (lecture notes, research papers, assignments, lab manuals and previous-year question papers) and get results ranked by relevance using BM25. PDFs are stored in **Amazon S3**, document metadata and the search index live in **Amazon DynamoDB**, and the Node.js / Express backend runs on **Amazon EC2**. **AWS IAM** controls access between these components.

## Architecture

```
Users (students / admin)
        |
   React frontend  (search, filters, results, admin upload)
        |  REST API
        v
  Amazon EC2: Node.js / Express
    - REST API layer
    - Search service      (query preprocessing, BM25 scoring, filters, ranking)
    - Indexing pipeline   (store PDF, extract text, tokenize, build inverted index)
        |                         |
        v                         v
  Amazon DynamoDB            Amazon S3
  (metadata + index)         (PDF files)

  AWS IAM: roles and policies secure access between EC2, DynamoDB and S3
```

- **Search:** the backend reads index terms and metadata from DynamoDB, scores documents with BM25 and returns ranked results.
- **PDF access:** each result carries a time-limited (15 minute) pre-signed S3 link to its PDF.
- **Upload:** the admin page sends a PDF to the backend, which stores it in S3, extracts and preprocesses the text, and updates the DynamoDB metadata and index.

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

1. **Credentials.** Install the AWS CLI and run `aws configure`, or put `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `backend/.env`. Never commit that file. On EC2, attach an IAM role to the instance instead of using access keys.
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
| Deployed on Amazon EC2 | Done |

See `docs/DYNAMODB_SCHEMA.md` for the table design and IAM permissions.
