const monthSelect = document.getElementById("month");
const daySelect = document.getElementById("day");

monthSelect.addEventListener('change', updateDays);

function updateDays() {
    const monthDays = {
        "January": 31, "February": 28, "March": 31, "April": 30, "May": 31, "June": 30,
        "July": 31, "August": 31, "September": 30, "October": 31, "November": 30, "December": 31
    };

    // Clear existing days
    daySelect.innerHTML = "";

    // Populate days based on the month
    for (let i = 1; i <= monthDays[monthSelect.value]; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
}

const fetchButton = document.getElementById("fetchButton");

fetchButton.addEventListener('click', async () => {
    const month = document.getElementById("month").value;
    const day = document.getElementById("day").value;

    try {
        const response = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ month, day })
        });

        const data = await response.json();
        if (data.success) {
            console.log("Message sent successfully!");

            // Store the S3 URL in the session storage
            sessionStorage.setItem('s3Url', data.s3Url);

        } else {
            console.error("Failed to send message:", data.message);
        }

        console.log(sessionStorage.getItem('s3Url'));
    } catch (error) {
        console.error("Error:", error);
    }
});

// Initial population
updateDays();
