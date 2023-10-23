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

// Initial population
updateDays();
