const baseURL = "http://3.27.123.207:3000";

const monthSelect = document.getElementById("month");
const daySelect = document.getElementById("day");
const fetchButton = document.getElementById("fetchButton");
const loadingContainer = document.getElementById("loadingContainer");
const inputContainer = document.getElementById("inputContainer");
const messageText = document.getElementById("messageText");
const restartButton = document.getElementById("restartButton");

function updateMessage(text, showRestart = false) {
  text = text.replace(/\n/g, "<br>"); // Replace newline characters with <br>
  messageText.innerHTML = text; // Use innerHTML to parse the <br> elements

  if (showRestart) {
    restartButton.style.display = "inline-block";
    restartButton.addEventListener("click", () => {
      // Refresh the page to restart the process
      location.reload();
    });
  } else {
    restartButton.style.display = "none";
  }
}

monthSelect.addEventListener("change", updateDays);

function updateDays() {
  const monthDays = {
    January: 31,
    February: 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  };

  // Clear existing days
  daySelect.innerHTML = "";

  // Populate days based on the month
  for (let i = 1; i <= monthDays[monthSelect.value]; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    daySelect.appendChild(option);
  }
}

fetchButton.addEventListener("click", async () => {
  const month = document.getElementById("month").value;
  const day = document.getElementById("day").value;

  inputContainer.style.display = "none"; // Hide the input container
  loadingContainer.style.display = "block"; // Display the loading text

  updateMessage("Sending request...");

  try {
    const response = await fetch(`${baseURL}/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, day }),
    });

    const data = await response.json();
    if (data.success) {
      updateMessage(
        "Job of creating GIF sent successfully!\nCreating GIF can take up to 1 minute."
      );
      console.log("Job of creating GIF sent successfully!");

      sessionStorage.setItem("s3KEY", `${day}-${month}.gif`);
    } else {
      updateMessage("Failed to send message. Please restart.", true);
      console.error("Failed to send message:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }

  startPolling();
});

function startPolling() {
  let tries = 0;
  const maxTries = 20;

  const interval = setInterval(async () => {
    if (tries >= maxTries) {
      updateMessage("Max tries reached. Please restart.\nEnter your birthday!");
      console.log("Max tries reached.");
      clearInterval(interval);
      loadingContainer.style.display = "none"; // Hide the loading container
      inputContainer.style.display = "block"; // Show the input container
      return;
    }

    const key = sessionStorage.getItem("s3KEY");
    try {
      const response = await fetch(`${baseURL}/get-gif?key=${key}`);
      const data = await response.json();

      if (data.success) {
        updateMessage("GIF created!", true);
        document.getElementById("downloadLink").style.display = "inline-block";
        console.log("GIF file retrieved successfully.");
        clearInterval(interval);

        // Display the GIF
        const gifImage = document.getElementById("gifImage");
        gifImage.src = data.url; // Assuming 'url' is the direct link to the gif
        gifImage.alt = "Your gif";
        document.getElementById("gifDisplay").style.display = "block";

        // Try fetching the image as a blob and create an object URL for download
        fetch(data.url)
          .then((response) => response.blob())
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const downloadLink = document.getElementById("downloadLink");
            downloadLink.href = url;
            downloadLink.download = "yourGIF.gif";
          });

        // Hide the loading container
        loadingContainer.style.display = "none";
      }
    } catch (error) {
      console.error("Error:", error);
    }

    tries += 1;
  }, 3000);
}

// Initial population
updateDays();
