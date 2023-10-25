const AWS = require("aws-sdk");
const fs = require("fs");
require("dotenv").config();

// Create an S3 client
const s3 = new AWS.S3();

// Specify the S3 bucket and object key
const bucketName = "tauro-assignment2-testing";
const objectKey = "earth.gif";

async function createS3bucket() {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
  } catch (err) {
    if (err.statusCode === 409) {
      console.log(`Bucket already exists: ${bucketName}`);
    } else {
      console.log(`Error creating bucket: ${err}`);
    }
  }
}

// Upload the GIF to S3
async function uploadGifToS3() {
  const gifData = fs.readFileSync('earth.gif'); // Read the file

  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: gifData,
    ContentType: "image/gif", // Set content type
  };

  try {
    await s3.putObject(params).promise();
    console.log("GIF file uploaded successfully.");
  } catch (err) {
    console.error("Error uploading GIF file:", err);
  }
}

// Retrieve the GIF from S3 and save it
async function getGifFromS3() {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    const data = await s3.getObject(params).promise();
    fs.writeFileSync('downloaded_earth.gif', data.Body); // Save the downloaded file
    console.log("GIF file downloaded successfully.");
  } catch (err) {
    console.error("Error:", err);
  }
}

// Call the upload and get functions
(async () => {
  // await createS3bucket();
  await uploadGifToS3();
  await getGifFromS3();
})();
