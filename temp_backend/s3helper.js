// s3Helper.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function getGifFromS3(objectKey) {
    console.log(`Looking for ${objectKey} in S3 bucket...`);
    const params = {
        Bucket: "tauro-assignment2",
        Key: objectKey,
    };

    try {
        const data = await s3.getObject(params).promise();
        return { success: true, url: data.Location };
    } catch (err) {
        if (err.code === 'NoSuchKey' || err.statusCode === 404) {
            return { success: false };
        } else {
            throw err;
        }
    }
}

module.exports = { getGifFromS3 };
