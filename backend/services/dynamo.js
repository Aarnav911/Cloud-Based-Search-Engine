// All DynamoDB access lives here. Single-table design:
//
//   PK            SK         what it is
//   DOC#<id>      META       one item per document (metadata + text for snippets)
//   TERM#<term>   DOC#<id>   one posting per (term, document): tf, doc length, filter fields
//   CORPUS        STATS      totalDocs and totalLength, for the BM25 average length
//
// GSI1 (GSI1PK = "DOCS", GSI1SK = createdAt) lists documents newest first.
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  BatchGetCommand,
  BatchWriteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { ddb } = require("./clients");
const { table: TableName } = require("../config");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

// Alias every attribute name so reserved words like "type" and "text" are safe.
function project(attrs) {
  const names = {};
  attrs.forEach((a, i) => (names[`#p${i}`] = a));
  return {
    ProjectionExpression: Object.keys(names).join(", "),
    ExpressionAttributeNames: names,
  };
}

// Writes put/delete requests 25 at a time (the DynamoDB limit), retrying throttled ones.
async function batchWrite(requests) {
  for (const group of chunk(requests, 25)) {
    let pending = group;
    for (let attempt = 0; pending.length; attempt++) {
      if (attempt > 8) throw new Error("DynamoDB kept throttling the write. Try again.");
      const res = await ddb.send(
        new BatchWriteCommand({ RequestItems: { [TableName]: pending } }),
      );
      pending = res.UnprocessedItems?.[TableName] || [];
      if (pending.length) await sleep(Math.min(100 * 2 ** attempt, 2000));
    }
  }
}

async function saveDocument(meta, termCounts) {
  const { docId } = meta;
  await ddb.send(
    new PutCommand({
      TableName,
      Item: {
        PK: `DOC#${docId}`,
        SK: "META",
        ...meta,
        status: "Indexed",
        GSI1PK: "DOCS",
        GSI1SK: meta.createdAt,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  );

  const postings = [...termCounts].map(([term, tf]) => ({
    PutRequest: {
      Item: {
        PK: `TERM#${term}`,
        SK: `DOC#${docId}`,
        tf,
        dl: meta.docLen,
        course: meta.course,
        semester: meta.semester,
        type: meta.type,
      },
    },
  }));
  await batchWrite(postings);

  // Last, so a half-written document never skews the corpus statistics.
  await ddb.send(
    new UpdateCommand({
      TableName,
      Key: { PK: "CORPUS", SK: "STATS" },
      UpdateExpression: "ADD totalDocs :one, totalLength :len",
      ExpressionAttributeValues: { ":one": 1, ":len": meta.docLen },
    }),
  );
}

// Best-effort cleanup if saving fails part-way.
async function removeDocumentItems(docId, terms) {
  const requests = [
    { DeleteRequest: { Key: { PK: `DOC#${docId}`, SK: "META" } } },
    ...terms.map((term) => ({
      DeleteRequest: { Key: { PK: `TERM#${term}`, SK: `DOC#${docId}` } },
    })),
  ];
  await batchWrite(requests);
}

async function getCorpusStats() {
  const { Item } = await ddb.send(
    new GetCommand({
      TableName,
      Key: { PK: "CORPUS", SK: "STATS" },
      ConsistentRead: true,
    }),
  );
  const totalDocs = Item?.totalDocs || 0;
  const totalLength = Item?.totalLength || 0;
  return { totalDocs, avgDocLen: totalDocs ? totalLength / totalDocs : 0 };
}

// Every posting for one term (follows pagination).
async function getPostings(term) {
  const items = [];
  let startKey;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `TERM#${term}` },
        ...project(["SK", "tf", "dl", "course", "semester", "type"]),
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...res.Items);
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return items.map((i) => ({
    docId: i.SK.slice(4),
    tf: i.tf,
    dl: i.dl,
    course: i.course,
    semester: i.semester,
    type: i.type,
  }));
}

async function getDocuments(docIds, attrs) {
  const found = new Map();
  for (const group of chunk(docIds, 100)) {
    let keys = group.map((id) => ({ PK: `DOC#${id}`, SK: "META" }));
    for (let attempt = 0; keys.length; attempt++) {
      if (attempt > 8) throw new Error("DynamoDB kept throttling the read. Try again.");
      const res = await ddb.send(
        new BatchGetCommand({
          RequestItems: { [TableName]: { Keys: keys, ...project(attrs) } },
        }),
      );
      for (const item of res.Responses?.[TableName] || []) found.set(item.docId, item);
      keys = res.UnprocessedKeys?.[TableName]?.Keys || [];
      if (keys.length) await sleep(Math.min(100 * 2 ** attempt, 2000));
    }
  }
  return found;
}

async function listDocuments(limit = 50) {
  const res = await ddb.send(
    new QueryCommand({
      TableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :p",
      ExpressionAttributeValues: { ":p": "DOCS" },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return res.Items;
}

module.exports = {
  saveDocument,
  removeDocumentItems,
  getCorpusStats,
  getPostings,
  getDocuments,
  listDocuments,
};
