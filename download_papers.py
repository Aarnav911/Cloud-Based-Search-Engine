
import json
import time
import requests
import boto3
from pathlib import Path
from botocore.exceptions import ClientError

# ================= CONFIGURATION =================

BUCKET = "scholarfind-pdfs-2026-583921"
MAX_PAPERS = 2500

DATASET = Path("data/arxiv-metadata-oai-snapshot.json")
PDF_DIR = Path("data/pdfs")

S3_PREFIX = "documents/"

ALLOWED_CATEGORIES = {
    "cs.AI",
    "cs.DB",
    "cs.IR",
    "cs.SE",
    "cs.DC",
    "cs.LG",
    "cs.CC",
    "cs.NI",
}

# Delay between arXiv requests
REQUEST_DELAY = 3

# ================= SETUP =================

PDF_DIR.mkdir(parents=True, exist_ok=True)

s3 = boto3.client("s3")

session = requests.Session()
session.headers.update({
    "User-Agent": "ScholarFind-Student-Project/1.0"
})


# ================= FIND EXISTING PDFs =================

print("Checking existing PDFs in S3...")

existing_keys = set()

paginator = s3.get_paginator("list_objects_v2")

for page in paginator.paginate(
    Bucket=BUCKET,
    Prefix=S3_PREFIX
):
    for item in page.get("Contents", []):
        key = item["Key"]

        if key.lower().endswith(".pdf"):
            existing_keys.add(key)

print("Existing PDFs:", len(existing_keys))

if len(existing_keys) >= MAX_PAPERS:
    print("Target already reached!")
    raise SystemExit

if not DATASET.exists():
    print("Metadata file not found:", DATASET)
    raise SystemExit


# ================= DOWNLOAD FUNCTION =================

def download_pdf(arxiv_id, local_path):
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}"

    try:
        response = session.get(
            pdf_url,
            timeout=90
        )

        response.raise_for_status()

        if not response.content.startswith(b"%PDF"):
            print("Response was not a PDF:", arxiv_id)
            return False

        local_path.write_bytes(response.content)

        return True

    except requests.RequestException as error:
        print("Download failed:", arxiv_id, error)
        return False


# ================= MAIN PROCESS =================

uploaded_this_run = 0
failed = 0

print("Starting download and upload...")
print("Target total:", MAX_PAPERS)

with DATASET.open(
    "r",
    encoding="utf-8"
) as source:

    for line in source:

        # Stop when total S3 PDFs reaches target
        if len(existing_keys) >= MAX_PAPERS:
            break

        try:
            paper = json.loads(line)

        except json.JSONDecodeError:
            continue

        categories = set(
            paper.get("categories", "").split()
        )

        if not categories.intersection(ALLOWED_CATEGORIES):
            continue

        paper_id = paper.get("id", "").strip()

        if not paper_id:
            continue

        safe_id = paper_id.replace("/", "_")

        s3_key = f"{S3_PREFIX}{safe_id}.pdf"

        # Skip files already in S3
        if s3_key in existing_keys:
            continue

        local_pdf = PDF_DIR / f"{safe_id}.pdf"

        print(
            f"\nProcessing paper: {paper_id}"
        )

        # Reuse local PDF if already downloaded
        if not local_pdf.exists():

            if not download_pdf(
                paper_id,
                local_pdf
            ):
                failed += 1
                time.sleep(REQUEST_DELAY)
                continue

        # Upload PDF to S3
        try:

            s3.upload_file(
                str(local_pdf),
                BUCKET,
                s3_key
            )

            existing_keys.add(s3_key)

            uploaded_this_run += 1

            print(
                f"Uploaded: {uploaded_this_run}"
                f" | Total in S3: {len(existing_keys)}"
                f"/{MAX_PAPERS}"
            )

        except ClientError as error:

            failed += 1

            print(
                "S3 upload failed:",
                paper_id,
                error
            )

        time.sleep(REQUEST_DELAY)


# ================= FINISHED =================

print("\n================================")
print("PROCESS FINISHED")
print("================================")

print("Total PDFs in S3:", len(existing_keys))
print("New PDFs uploaded:", uploaded_this_run)
print("Failed attempts:", failed)

print(
    f"S3 folder: s3://{BUCKET}/{S3_PREFIX}"
)
