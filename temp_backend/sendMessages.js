const {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
  CreateQueueCommand,
} = require("@aws-sdk/client-sqs");
const { parseUrl } = require("@smithy/url-parser");
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { formatUrl } = require("@aws-sdk/util-format-url");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { Hash } = require("@aws-sdk/hash-node");
const { HttpRequest } = require("@aws-sdk/protocol-http");
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");

// Constants for AWS region and S3 bucket name
const REGION = "ap-southeast-2";
const BUCKET = "tauro-assignment2";

// Initializing clients for S3 and SQS
const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });

// Checks if the specified S3 bucket exists
const bucketExists = async (bucketName) => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error.name === "NoSuchBucket") {
      return false; // Bucket does not exist
    }
    throw error; // Some other error occurred
  }
};

// Creates a new S3 bucket with the specified name
const createBucket = async (bucketName) => {
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    return true; // Bucket successfully created
  } catch (error) {
    throw error; // Error creating bucket
  }
};

// Checks if the specified SQS queue exists and returns its URL if it does
const queueExists = async (queueName) => {
  try {
    const getQueueUrlParams = {
      QueueName: queueName,
    };
    const data = await sqsClient.send(
      new GetQueueUrlCommand(getQueueUrlParams)
    );
    return data.QueueUrl;
  } catch (error) {
    if (error.name === "QueueDoesNotExist") {
      return null; // Queue does not exist
    }
    throw error; // Some other error occurred
  }
};

// Creates a new SQS queue with the specified name and returns its URL
const createQueue = async (queueName) => {
  const createQueueParams = {
    QueueName: queueName,
  };
  const data = await sqsClient.send(new CreateQueueCommand(createQueueParams));
  return data.QueueUrl;
};

// Generates a presigned URL for S3 without requiring a specific client instance
const createPresignedUrlWithoutClient = async ({ region, bucket, key }) => {
  const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  const presigner = new S3RequestPresigner({
    credentials: fromIni(),
    region,
    sha256: Hash.bind(null, "sha256"),
  });
  const signedUrlObject = await presigner.presign(
    new HttpRequest({ ...url, method: "PUT" })
  );
  return formatUrl(signedUrlObject);
};

// Sends a message to SQS with details about the GIF request for a specific date
const sendMessage = async (month, day) => {
  const KEY = `${day}-${month}.gif`;

  if (!(await bucketExists(BUCKET))) {
    console.log("Bucket does not exist. Creating...");
    await createBucket(BUCKET);
    console.log("Bucket created:", BUCKET);
  }

  const presignedUrl = await createPresignedUrlWithoutClient({
    region: REGION,
    bucket: BUCKET,
    key: KEY,
  });

  const queueName = "group99";
  let queueUrl = await queueExists(queueName);

  if (!queueUrl) {
    console.log("Queue does not exist. Creating...");
    queueUrl = await createQueue(queueName);
    console.log("Queue created with URL:", queueUrl);
  }

  // Constructing the message to send to SQS
  const params = {
    DelaySeconds: 0,
    MessageAttributes: {
      Month: {
        DataType: "String",
        StringValue: month,
      },
      Day: {
        DataType: "Number",
        StringValue: String(day),
      },
      PresignedUrl: {
        DataType: "String",
        StringValue: presignedUrl,
      },
    },
    MessageBody: `Request for a GIF for the date ${month} ${day}`,
    QueueUrl: queueUrl,
  };

  // Sending the message to SQS
  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    console.log("Success", data.MessageId);
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = {
  sendMessage,
};
