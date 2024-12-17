document.addEventListener("DOMContentLoaded", function() {
    updateInfo();
});

// Get updated pharmacy info on page load (function called on document load above)
async function updateInfo() {
    try {
        const response = await fetch('/info');
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
    
        const data = await response.json(); 

        // format response data
        document.getElementById("info").innerHTML = `
            <h2>Welcome to ${data.name}!</h2>
            <p>${data.website}</p>
            <p>${data.phoneNumber}</p>
            <p>${data.address.street}<br>
                ${data.address.city}, ${data.address.state} ${data.address.zip}</p>
            <h3>Hours of operation:</h3>
            <table>
                <tr>
                    <td>Monday</td>
                    <td>${data.hours.monday.open} - ${data.hours.monday.close}</td>
                </tr>
                <tr>
                    <td>Tuesday</td>
                    <td>${data.hours.tuesday.open} - ${data.hours.tuesday.close}</td>
                </tr>
                <tr>
                    <td>Wednesday</td>
                    <td>${data.hours.wednesday.open} - ${data.hours.wednesday.close}</td>
                </tr>
                <tr>
                    <td>Thursday</td>
                    <td>${data.hours.thursday.open} - ${data.hours.thursday.close}</td>
                </tr>
                <tr>
                    <td>Friday</td>
                    <td>${data.hours.friday.open} - ${data.hours.friday.close}</td>
                </tr>
                <tr>
                    <td>Saturday</td>
                    <td>${data.hours.saturday.open} - ${data.hours.saturday.close}</td>
                </tr>
                <tr>
                    <td>Sunday</td>
                    <td>${data.hours.sunday.open} - ${data.hours.sunday.close}</td>
                </tr>
            </table>
            <p>Owned and operated by ${data.owner}</p>
        `;
    } catch (error) {
        alert('Something went wrong!')
        console.error('There was a problem with the fetch operation:', error);
    }
}