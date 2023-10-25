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

const REGION = "ap-southeast-2";
const BUCKET = "tauro-assignment2";
const sqsClient = new SQSClient({ region: REGION });

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

const createQueue = async (queueName) => {
  const createQueueParams = {
    QueueName: queueName,
  };
  const data = await sqsClient.send(new CreateQueueCommand(createQueueParams));
  return data.QueueUrl;
};

const createPresignedUrlWithoutClient = async ({ region, bucket, key }) => {
  // 1. Parse the base URL for the desired object in S3.
  const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  
  // 2. Create a presigner instance using the provided credentials, region, and SHA-256 hash function.
  const presigner = new S3RequestPresigner({
    credentials: fromIni(),
    region,
    sha256: Hash.bind(null, "sha256"),
  });

  // 3. Use the presigner to create a pre-signed request for the given URL.
  const signedUrlObject = await presigner.presign(
    new HttpRequest({ ...url, method: "PUT" }),
  );
  
  // 4. Convert the signed request object back to a string URL.
  return formatUrl(signedUrlObject);
};

const sendMessage = async (month, day) => {
  const KEY = `${day}-${month}.gif`;

  // Generate the presigned URL for the worker to upload the result to
  const presignedUrl = await createPresignedUrlWithoutClient({
      region: REGION,
      bucket: BUCKET,
      key: KEY
  });

  const queueName = "group99";
  let queueUrl = await queueExists(queueName);

  if (!queueUrl) {
    console.log("Queue does not exist. Creating...");
    queueUrl = await createQueue(queueName);
    console.log("Queue created with URL:", queueUrl);
  }

  const params = {
    DelaySeconds: 0,
    MessageAttributes: {
      Month: {
        DataType: "String",
        StringValue: month,
      },
      Day: {
        DataType: "Number",
        StringValue: String(day), // Convert day to string
      },
      PresignedUrl: {
        DataType: "String",
        StringValue: presignedUrl,
      },
    },
    MessageBody: `Request for a GIF for the date ${month} ${day}`,
    QueueUrl: queueUrl, // QueueUrl is set here
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    console.log("Success", data.MessageId);
  } catch (err) {
    console.log("Error", err);
  }
  
  // return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${KEY}`;
};

// Export the sendMessage function
module.exports = {
  sendMessage,
};
