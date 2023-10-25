const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function getPresignedUrl(objectKey) {
    const params = {
        Bucket: "tauro-assignment2",
        Key: objectKey,
        Expires: 3600 // URL expires in 1 hour
    };

    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', params, (error, url) => {
            if (error) reject(error);
            else resolve(url);
        });
    });
}

async function getGifFromS3(objectKey) {
    try {
        // First, verify the object exists. This step isn't mandatory, but useful for validation
        const headData = await s3.headObject({ Bucket: "tauro-assignment2", Key: objectKey }).promise();

        // If the object exists (no errors in the above line), generate a presigned URL
        const url = await getPresignedUrl(objectKey);

        return { success: true, url: url };
    } catch (err) {
        if (err.code === 'NoSuchKey' || err.statusCode === 404) {
            return { success: false };
        } else {
            throw err;
        }
    }
}

module.exports = { getGifFromS3 };
