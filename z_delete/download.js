const AWS = require("aws-sdk");
const fs = require("fs");
// require("dotenv").config();

// Create an S3 client
const s3 = new AWS.S3();

// Specify the S3 bucket and object key
const bucketName = "tauro-assignment2";
const objectKey = "12May.gif";

// Retrieve the GIF from S3 and save it
async function getGifFromS3() {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  let startTime = Date.now(); // Capture the start time

  try {
    const data = await s3.getObject(params).promise();
    fs.writeFileSync('downloaded_earth.gif', data.Body); // Save the downloaded file
    console.log("GIF file downloaded successfully.");
    clearInterval(interval); // Clear the interval if the file is successfully downloaded
  } catch (err) {
    if (err.code !== 'NoSuchKey' && err.statusCode !== 404) {
      console.error("Error:", err);
      clearInterval(interval); // Clear the interval if the error is not 404
    }
  } finally {
    let endTime = Date.now(); // Capture the end time
    console.log(`Time spent on try ${tries + 1}: ${endTime - startTime}ms`); // Log the time difference
  }
}

// Try every 3 seconds for one minute
let tries = 0;
const maxTries = 20; // 20 tries * 3 seconds = 60 seconds or 1 minute

const interval = setInterval(async () => {
  if (tries >= maxTries) {
    console.log("Max tries reached.");
    clearInterval(interval);
    return;
  }
  
  await getGifFromS3();
  tries += 1;
}, 3000);

// Call the upload and get functions
(async () => {
  await getGifFromS3();
})();
