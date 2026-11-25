require("dotenv").config({ quiet: true });

module.exports = {
  port: process.env.PORT || 3000,
  region: process.env.AWS_REGION || "ap-south-1",
  table: process.env.DYNAMODB_TABLE || "ScholarFind",
  bucket: process.env.S3_BUCKET,
  // Only set these to use local emulators instead of real AWS.
  dynamoEndpoint: process.env.DYNAMODB_ENDPOINT,
  s3Endpoint: process.env.S3_ENDPOINT,
  signedUrlSeconds: 15 * 60,
  maxUploadMb: 25,
  maxResults: 20,
};
