// Creates the DynamoDB table and the S3 bucket. Safe to run more than once.
const {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} = require("@aws-sdk/client-dynamodb");
const {
  CreateBucketCommand,
  HeadBucketCommand,
  PutPublicAccessBlockCommand,
} = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { s3 } = require("../services/clients");
const cfg = require("../config");

const dynamo = new DynamoDBClient({
  region: cfg.region,
  ...(cfg.dynamoEndpoint && { endpoint: cfg.dynamoEndpoint }),
});

async function setupTable() {
  try {
    await dynamo.send(new DescribeTableCommand({ TableName: cfg.table }));
    console.log(`DynamoDB table "${cfg.table}" already exists.`);
    return;
  } catch (err) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }
  await dynamo.send(
    new CreateTableCommand({
      TableName: cfg.table,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: {
            ProjectionType: "INCLUDE",
            NonKeyAttributes: [
              "docId", "title", "course", "semester", "type",
              "fileName", "pages", "status", "createdAt",
            ],
          },
        },
      ],
    }),
  );
  await waitUntilTableExists({ client: dynamo, maxWaitTime: 120 }, { TableName: cfg.table });
  console.log(`Created DynamoDB table "${cfg.table}".`);
}

async function setupBucket() {
  if (!cfg.bucket) throw new Error("Set S3_BUCKET in .env first.");
  try {
    await s3.send(
      new CreateBucketCommand({
        Bucket: cfg.bucket,
        // us-east-1 must not send a location constraint.
        ...(cfg.region !== "us-east-1" && {
          CreateBucketConfiguration: { LocationConstraint: cfg.region },
        }),
      }),
    );
    console.log(`Created S3 bucket "${cfg.bucket}".`);
  } catch (err) {
    if (err.name === "BucketAlreadyOwnedByYou") {
      console.log(`S3 bucket "${cfg.bucket}" already exists.`);
    } else if (err.name === "BucketAlreadyExists") {
      // Either it is yours, or another AWS account owns that name.
      try {
        await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
        console.log(`S3 bucket "${cfg.bucket}" already exists.`);
      } catch {
        throw new Error(
          `The bucket name "${cfg.bucket}" is already taken by another AWS account. Pick a different S3_BUCKET.`,
        );
      }
    } else {
      throw err;
    }
  }
  if (cfg.s3Endpoint) return; // local emulators do not support this call
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: cfg.bucket,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
    }),
  );
  console.log("Public access is blocked on the bucket.");
}

(async () => {
  await setupTable();
  await setupBucket();
  console.log("AWS setup complete.");
})().catch((err) => {
  console.error("Setup failed:", err.name, "-", err.message);
  process.exit(1);
});
