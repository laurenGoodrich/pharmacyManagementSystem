const defaultPassword = 'DefaultPassword!'

// Function to handle login form submission
function handleLogin() {
    event.preventDefault(); // Prevent the default form submission

    // Get inputs from the form
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const data = { username: username, password: password };

    // Basic validation: Check if fields are filled
    if (!username || !password) {
        alert('Please enter both username and password.');
        return; // Exit if validation fails
    }

    // Send a POST request to the login endpoint
    fetch('/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    })
    .then(response => {
        return response.text();
    })
    .then(text => {
        console.log(text);
        if (text == "SUCCESS") {
            console.log('Login successful');
            if (password == defaultPassword) {
                resetPassword();
            }
            else {
                window.location.href = '/pages/home.html'; // Redirect to dashboard
            }
        } 
        // locked out
        else if (text == "Too many failed attempts. Try again later.") {
            alert(text);
        }
        // incorrect username/pw
        else if (text == "Failure to log in") {
            alert("Incorrect username or password. Please try again.");
        }
        else {
            console.log('Login failed:', text);
        }
    })
    .catch(error => {
        console.error(error);
    });
}

// display form for setting new password 
function resetPassword() {
    document.getElementById("passwordForm").style.display = "flex";
}

// get new password and update user account with the new pw
function setNewPw() {
    pw1 = document.getElementById("newPassword").value;
    pw2 = document.getElementById("newPassword2").value;
    if (!pw1 || !pw2) {
        alert("All fields are required - please enter and confirm a new password");
        return;
    }
    if (pw1 != pw2) {
        alert("Passwords must match.");
        return;
    }
    if (pw1 == defaultPassword) {
        alert("Must choose a different password.");
        return;
    }

    data = {
        username: document.getElementById('username').value,
        password: pw1
    }

    // Update account info
    fetch('/accounts/updateAccountPw', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then((result) => result.text())
    .then((text) => {
        if (text === "Account updated successfully") {
            console.log("Account updated");
            window.location.href = '/pages/home.html'; // Redirect to dashboard
        } else {
            console.log("Error updating account");
        }
    })
    .catch(() => {
        console.log("Error connecting to server");
    });
}

// close form for setting new pw
function closePasswordSettingsForm() {
    document.getElementById("passwordForm").style.display = "none";
}