// Default pw for first time users
const defaultPassword = "DefaultPassword!";

// open locked accounts popup
function openLockedAccounts() {
    document.getElementById("lockedForm").style.display = "flex";
    // set the window to display locked accounts
    getLockedAccounts();
}

// get locked accounts for the popup 
function getLockedAccounts(){
    fetch('/accounts/locked')
    .then((result) => {
        return result.text();
    }).then((text) => {
        document.getElementById("lockedAccountList").innerHTML = text;
    })
    .catch(() => {
        console.log("Error getting locked accounts");
    });
}

// unlock an account
function unlockAccount(e) {
    let id = e.id.split("-")[0];

    fetch(`/accounts/unlockAccount?id=${id}`)
    .then((response) => {
        return response.text();
    })
    .then((result) => {
        if (result == "Account unlocked successfully"){
            console.log(result);
            getLockedAccounts();
        }
    })
    .catch((err) =>{
        console.error(err);
    })
}

// close locked accounts form
function closeLockedAccounts() {
    document.getElementById("lockedForm").style.display = "none";
}

// close update pharmacy info popup
function closeUpdateInfo() {
    document.getElementById("infoFormPopup").style.display = "none";
}

// open update pharmacy info popup - with prefilled information
async function openUpdateInfo() {
    try {
        const response = await fetch('/info');
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
    
        const data = await response.json(); 

        document.getElementById("infoForm").innerHTML = `
            <h2>Pharmacy Information</h2>
            <table>
                <tr>
                    <td><label for="pharmName">Name</label></td>
                    <td><input type="text" id="pharmName" value='${data.name}'></td>
                </tr>
                <tr>
                    <td><label for="pharmWebsite">Website</label></td>
                    <td><input type="text" id="pharmWebsite" value='${data.website}'></td>
                </tr>
                <tr>
                    <td>Address</td>
                    <td>
                        <input type="text" id="pharmStreet" placeholder="Street address" value='${data.address.street}'>
                        <input type="text" id="pharmCity" placeholder="City" value='${data.address.city}'>
                        <input type="text" id="pharmState" placeholder="State" value='${data.address.state}'>
                        <input type="text" id="pharmZip" placeholder="Zip" value='${data.address.zip}'>
                    </td>
                </tr>
                <tr>
                    <td><label for="pharmOwner">Owner</label></td>
                    <td><input type="text" id="pharmOwner" value='${data.owner}'></td>
                </tr>
                <tr>
                    <td><label for="pharmPhone">Phone Number</label></td>
                    <td><input type="text" id="pharmPhone" value='${data.phoneNumber}'></td>
                </tr>
                <tr>
                    <td>Hours</td>
                    <td>
                        <table>
                            <tr>
                                <td>Monday</td>
                                <td>
                                    <input type="text" id="monOpen" value='${data.hours.monday.open}'>
                                    -
                                    <input type="text" id="monClose" value='${data.hours.monday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Tuesday</td>
                                <td>
                                    <input type="text" id="tuesOpen" value='${data.hours.tuesday.open}'>
                                    -
                                    <input type="text" id="tuesClose" value='${data.hours.tuesday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Wednesday</td>
                                <td>
                                    <input type="text" id="wedOpen" value='${data.hours.wednesday.open}'>
                                    -
                                    <input type="text" id="wedClose" value='${data.hours.wednesday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Thursday</td>
                                <td>
                                    <input type="text" id="thursOpen" value='${data.hours.thursday.open}'>
                                    -
                                    <input type="text" id="thursClose" value='${data.hours.thursday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Friday</td>
                                <td>
                                    <input type="text" id="friOpen" value='${data.hours.friday.open}'>
                                    -
                                    <input type="text" id="friClose" value='${data.hours.friday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Saturday</td>
                                <td>
                                    <input type="text" id="satOpen" value='${data.hours.saturday.open}'>
                                    -
                                    <input type="text" id="satClose" value='${data.hours.saturday.close}'>
                                </td>
                            </tr>
                            <tr>
                                <td>Sunday</td>
                                <td>
                                    <input type="text" id="sunOpen" value='${data.hours.sunday.open}'>
                                    -
                                    <input type="text" id="sunClose" value='${data.hours.sunday.close}'>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        `;
    } catch (error) {
        alert('Something went wrong!')
        console.error('There was a problem with the fetch operation:', error);
    }
    
    document.getElementById("infoFormPopup").style.display = "flex";
}

// send updated info to server to be saved
function updateInfo() {
    let name = document.getElementById('pharmName').value;
    let website = document.getElementById('pharmWebsite').value;
    let street = document.getElementById('pharmStreet').value;
    let city = document.getElementById('pharmCity').value;
    let state = document.getElementById('pharmState').value;
    let zip = document.getElementById('pharmZip').value;
    let owner = document.getElementById('pharmOwner').value;
    let phone = document.getElementById('pharmPhone').value;
    let monOpen = document.getElementById('monOpen').value;
    let monClose = document.getElementById('monClose').value;
    let tuesOpen = document.getElementById('tuesOpen').value;
    let tuesClose = document.getElementById('tuesClose').value;
    let wedOpen = document.getElementById('wedOpen').value;
    let wedClose = document.getElementById('wedClose').value;
    let thursOpen = document.getElementById('thursOpen').value;
    let thursClose = document.getElementById('thursClose').value;
    let friOpen = document.getElementById('friOpen').value;
    let friClose = document.getElementById('friClose').value;
    let satOpen = document.getElementById('satOpen').value;
    let satClose = document.getElementById('satClose').value;
    let sunOpen = document.getElementById('sunOpen').value;
    let sunClose = document.getElementById('sunClose').value;

    let data = {
        name: name,
        website: website,
        address: {
            street: street,
            city: city,
            state: state,
            zip: zip
        },
        owner: owner,
        phoneNumber: phone,
        hours: {
            monday: {
                open: monOpen,
                close: monClose
            },
            tuesday: {
                open: tuesOpen,
                close: tuesClose
            },
            wednesday: {
                open: wedOpen,
                close: wedClose
            },
            thursday: {
                open: thursOpen,
                close: thursClose
            },
            friday: {
                open: friOpen,
                close: friClose
            },
            saturday: {
                open: satOpen,
                close: satClose
            },
            sunday: {
                open: sunOpen,
                close: sunClose
            }
        }
    }

    fetch('/update/info', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"} 
    });

    closeUpdateInfo();
}

// add an account
function addAccount() {
    var staffName = document.getElementById("staffName").value;
    var staffType = document.getElementById("staffType").value;
    var username = document.getElementById("username").value;
    var password = defaultPassword;

    if(!staffName || !staffType || !username) {
        alert("Please fill in all fields.");
        return;
    }
    
    let data = {staffName: staffName, staffType: staffType, username: username, password: password};
    console.log('Adding Account', data);

    fetch('/accounts/addAccount', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Account added successfully"){
            console.log("Account added");
            getAccounts();
        }
        else{
            alert("Error adding account: " + text);
        }
    })
    .catch(() => {
        console.log("Error adding account");
    });
    
    closeCreateAccountForm();
}

// get all accounts
function getAccounts() {
    console.log("Getting accounts...");
    fetch('/accounts')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("accountList").innerHTML = message;
    })
    .catch((error) => {
        console.error("Error fetching accounts:", error);
    });
}

// delete an account
function removeAccount(button) {
    let buttonId = button.id;
    if (!buttonId.endsWith('-delete')) {
        console.log("Invalid button id");
        return;
    }
    const id = buttonId.slice(0, buttonId.length - 7);

    let data = {id: id};

    fetch('/accounts/removeAccount', {
        method: 'POST',
        body: JSON.stringify(data),
        headers:{"Content-Type": "application/json"}
    })
    .then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Account deleted successfully"){
            console.log("Account removed");
            getAccounts();
        }
        else{
            console.log(text);
        }
    })
    .catch(() => {
        console.log("Error");
    });
}

// open add account form
function openForm(obj, num) {
    const e = document.getElementById("submit-btn");
    e.onclick = null;
    console.log("openForm " + num);
    if (num === 1){
        e.addEventListener("click", function() {
            addAccount()
        });
        document.getElementById("password").value = defaultPassword;
        document.getElementById("password").readOnly = true;
        document.getElementById("username").value = "";
        document.getElementById("staffName").value = "";
        document.getElementById("staffType").value = "";
    }
    if (num === 2){
        document.getElementById("submit-btn").innerText = "Update Account";
        e.addEventListener("click", function() {
            saveUpdatedAccount(obj.id.split("-")[0])
        });
        updateAccount(obj.id);
    }
    document.getElementById("accountForm").style.display = "flex";
}

// close create accoung form
function closeCreateAccountForm() {
    document.getElementById("accountForm").style.display = "none";
}

// update account - set inputs to be editable
function updateAccount(id) {
    id = id.split("-")[0];

    //set initial values of the form
    fetch(`/find/account?id=${id}`)
    .then(response => {
        return response.json();
    })
    .then(result => {
        document.getElementById("username").value = result.patient.username;
        document.getElementById("password").value = result.patient.password;
        document.getElementById("staffName").value = result.patient.staffName;
        document.getElementById("staffType").value = result.patient.staffType;
    })
    .catch(e => {
        console.error(e);
    })
}

// save updated account info
function saveUpdatedAccount(id) {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let staffName = document.getElementById("staffName").value;
    let staffType = document.getElementById("staffType").value;

    if (password == defaultPassword){
        alert("Password cannot be the same as default password.");
        return;
    }

    // Prepare data to send to server
    let data = { id: id, staffName: staffName, staffType: staffType, username: username, password: password };

    // Send data to server
    fetch('/accounts/updateAccount', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then((result) => result.text())
    .then((text) => {
        if (text === "Account updated successfully") {
            console.log("Account updated");
            closeCreateAccountForm(); // Close the form popup
            getAccounts(); // Refresh the account list
        } else {
            console.log("Error updating account");
        }
    })
    .catch(() => {
        console.log("Error connecting to server");
    });
}

// get accounts on page load 
document.addEventListener("DOMContentLoaded", function() {
    getAccounts();
});


