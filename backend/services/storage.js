const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("./clients");
const cfg = require("../config");

async function putPdf(key, buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    }),
  );
}

async function deletePdf(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

// A temporary link; the bucket itself stays private.
function signedPdfUrl(key) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: cfg.signedUrlSeconds },
  );
}

module.exports = { putPdf, deletePdf, signedPdfUrl };
