// Define your server endpoint
const url = 'http://localhost:3000';

const request = require('request'); 

function sendRequestAndStartPolling(month, day) {
  // Send a POST request with JSON data
  request.post(
    {
      url: `${url}/send-message`,
      json: { month, day },
    },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const data = body;
        if (data.success) {
          console.log('Job of creating GIF sent successfully!');
          console.log(`Job Key: ${day}-${month}.gif`);
        } else {
          console.error('Failed to send message:', data.message);
        }
      } else {
        console.error('Request failed:', error);
      }
    }
  );
}

const simulatedMonth = 'October';
const simulatedDay = '31';

// Limit the number of requests
const numRequests = 200; // You can change this to the desired number of requests
const delayBetweenRequests = 40000; // milliseconds between requests

let requestCount = 0;

// Create a loop with a limited number of requests
function sendRequests() {
  if (requestCount < numRequests) {
    sendRequestAndStartPolling(simulatedMonth, simulatedDay);
    requestCount++;
    setTimeout(sendRequests, delayBetweenRequests);
  }
}

// Start sending requests
sendRequests();
