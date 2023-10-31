const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { sendMessage } = require("./sendMessages");
const { getGifFromS3 } = require("./s3helper");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post("/send-message", async (req, res) => {
  try {
    const { month, day } = req.body;

    // Delegate the responsibility of creating presigned URL and sending the message to the sendMessage function.
    const s3Url = await sendMessage(month, day);

    // Return the direct S3 URL (not the pre-signed one) to the frontend
    res.json({ success: true, s3Url: s3Url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/get-gif", async (req, res) => {
  try {
    const objectKey = req.query.key;

    const response = await getGifFromS3(objectKey);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
