const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");
const cfg = require("../config");

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: cfg.region,
    ...(cfg.dynamoEndpoint && { endpoint: cfg.dynamoEndpoint }),
  }),
  { marshallOptions: { removeUndefinedValues: true } },
);

const s3 = new S3Client({
  region: cfg.region,
  ...(cfg.s3Endpoint && { endpoint: cfg.s3Endpoint, forcePathStyle: true }),
});

module.exports = { ddb, s3 };
