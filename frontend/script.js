const monthSelect = document.getElementById("month");
const daySelect = document.getElementById("day");
const fetchButton = document.getElementById("fetchButton");
const loadingContainer = document.getElementById("loadingContainer");
const inputContainer = document.getElementById("inputContainer");

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

  try {
    const response = await fetch("http://localhost:3000/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, day }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Message sent successfully!");

      sessionStorage.setItem("s3KEY", `${day}-${month}.gif`);
    } else {
      console.error("Failed to send message:", data.message);
    }

    console.log(sessionStorage.getItem("s3KEY"));
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
      console.log("Max tries reached.");
      clearInterval(interval);
      return;
    }

    const key = sessionStorage.getItem("s3KEY");
    try {
      const response = await fetch(`http://localhost:3000/get-gif?key=${key}`);
      const data = await response.json();

      if (data.success) {
        console.log("GIF file retrieved successfully.");
        clearInterval(interval);

        // If the server returns the direct S3 URL (requires public bucket/read permissions):
        // const imgTag = document.createElement("img");
        // imgTag.src = data.url;
        // document.body.appendChild(imgTag);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    tries += 1;
  }, 3000);
}

// Initial population
updateDays();
