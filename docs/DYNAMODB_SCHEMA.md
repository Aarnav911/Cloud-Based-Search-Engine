# DynamoDB schema

One table (`ScholarFind`, on-demand billing) holds the whole search index.
Keys are `PK` (partition) and `SK` (sort).

| PK | SK | Attributes | Purpose |
| --- | --- | --- | --- |
| `DOC#<docId>` | `META` | `docId`, `title`, `course`, `semester`, `type`, `fileName`, `s3Key`, `pages`, `docLen`, `text`, `status`, `createdAt`, `GSI1PK`, `GSI1SK` | One item per document. `text` is the first 30,000 characters, used for result snippets. |
| `TERM#<stem>` | `DOC#<docId>` | `tf`, `dl`, `course`, `semester`, `type` | Inverted index. One posting per (term, document). |
| `CORPUS` | `STATS` | `totalDocs`, `totalLength` | Totals for BM25's average document length. Updated atomically with `ADD`. |

**GSI1** (`GSI1PK` = `"DOCS"`, `GSI1SK` = `createdAt`) lists documents newest first for the admin page.

## Access patterns

| Need | Operation |
| --- | --- |
| Postings for a search term | `Query` PK = `TERM#<stem>` |
| Metadata for the top results | `BatchGetItem` on `DOC#<id>` / `META` |
| Corpus statistics | `GetItem` `CORPUS` / `STATS` |
| Recent uploads | `Query` GSI1 where `GSI1PK` = `"DOCS"`, newest first |

## Why it is shaped this way

- **Document frequency** for a term is the number of postings under its `TERM#` key, so no separate counter is stored.
- Each posting carries `dl` (document length), so BM25 can be scored without reading any `META` item. Only the top 20 results fetch metadata.
- Each posting also carries `course`, `semester` and `type`, so filters apply while ranking. IDF still uses the unfiltered posting count, so filtering never changes a term's weight.
- The PDF itself lives in S3 at `documents/<docId>.pdf` (private bucket). Search results include a 15-minute pre-signed link.

## Limits to know about

- A very common term has a long posting list; every search reads all of it. Fine for hundreds or thousands of documents.
- `GSI1PK` is a constant, so the admin list sits in one partition. Fine at this scale.
- Scanned PDFs (images with no text layer) are rejected until OCR is added.

## IAM permissions the running API needs

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
                 "dynamodb:Query", "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem"],
      "Resource": [
        "arn:aws:dynamodb:<region>:<account-id>:table/ScholarFind",
        "arn:aws:dynamodb:<region>:<account-id>:table/ScholarFind/index/GSI1"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<your-bucket>/*"
    }
  ]
}
```

`npm run setup:aws` also needs `dynamodb:CreateTable`, `dynamodb:DescribeTable`, `s3:CreateBucket`, `s3:ListBucket` and `s3:PutBucketPublicAccessBlock`. Use an admin user for that one step, or create the table and bucket in the console.
