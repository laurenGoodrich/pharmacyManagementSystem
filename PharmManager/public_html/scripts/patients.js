// on page load, getch patients 
document.addEventListener("DOMContentLoaded", function() {
    fetchPatients();
    // add event listener for searching patients on user input
    document.getElementById("name").addEventListener('input', async function() {
        const query = this.value;
        console.log(query);
    
        if (query.length < 3) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }
    
        try {
            const response = await fetch(`/search/patient?name=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            
            console.log(suggestions['patient']);
            
            const suggestionsList = document.getElementById('suggestions');
            suggestionsList.innerHTML = '';
            
            suggestions['patient'].forEach(item => {
                const li = document.createElement('li');
                console.log(item.name);
                li.textContent = item.name; // Adjust this based on your data structure
                li.addEventListener('click', () => {
                    document.getElementById('name').value = item.name; // Set the value of the search bar
                    suggestionsList.innerHTML = ''; // Clear suggestions
                });
                suggestionsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    });
});

// add a new patient 
function addPatient() {
    console.log("Adding a patient...");
    // Collect form input values
    var name = document.getElementById("patientName").value;
    var dateOfBirth = document.getElementById("dob").value;
    var phoneNumber = document.getElementById("phoneNumber").value;
    var email = document.getElementById("email").value;
    var street = document.getElementById("street").value;
    var city = document.getElementById("city").value;
    var state = document.getElementById("state").value;
    var zip = document.getElementById("zip").value;
    var insurance = document.getElementById("insurance").value;

    let data = {
        name: name,
        dateOfBirth: dateOfBirth,
        phoneNumber: phoneNumber,
        email: email,
        address: {
            street: street,
            city: city,
            state: state,
            zip: zip
        },
        insurance: insurance
    };

    console.log("Data to be sent:", data);

    fetch('/add/patient/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    })
    .then((result) => {
        return result.text();
    })
    .then((text) => {
        if (text === "Success") {
            console.log("Patient added successfully");
            fetchPatients(); 
        } else {
            console.log("Failed to add patient:", text);
        }
    })
    .catch((error) => {
        console.log("Error adding patient:", error);
    });
    fetchPatients();
    closeForm();
}

// get all patients 
function fetchPatients() {
    console.log("Getting patients");
    fetch('/patients')
    .then((response) => {
        return response.text();  
    })
    .then((message) => {
        document.getElementById("patientList").innerHTML = message;  
    })
    .catch((error) => {
        console.error('Error fetching patients:', error);
    });
}

// update patient - open the form and autofill it 
function updatePatient(e) {
    let id = e.id.split("-")[0];
    openForm(2)
    document.getElementById("submit-btn").className = "btn"
    document.getElementById("submit-btn").classList.add(id)
    //set initial values of the form
    fetch(`/find/patient?id=${id}`)
    .then(response => {
        return response.json();
    })
    .then(result => {
        document.getElementById("patientName").value = result.patient.name;
        document.getElementById("dob").value = result.patient.dateOfBirth;
        document.getElementById("phoneNumber").value = result.patient.phoneNumber;
        document.getElementById("email").value = result.patient.email;
        document.getElementById("street").value = result.patient.address.street;
        document.getElementById("city").value = result.patient.address.city;
        document.getElementById("state").value = result.patient.address.state;
        document.getElementById("zip").value = result.patient.address.zip;
        document.getElementById("insurance").value = result.patient.insurance;
    })
    .catch(e => {
        console.error(e);
    })
}

// get updated patient info from form and send to server
function sendPatientUpdates(e){
    let id = e.classList[1];
    console.log(id);
    var name = document.getElementById("patientName").value;
    var dateOfBirth = document.getElementById("dob").value;
    var phoneNumber = document.getElementById("phoneNumber").value;
    var email = document.getElementById("email").value;
    var street = document.getElementById("street").value;
    var city = document.getElementById("city").value;
    var state = document.getElementById("state").value;
    var zip = document.getElementById("zip").value;
    var insurance = document.getElementById("insurance").value;

    let data = {id: id, name: name, dateOfBirth: dateOfBirth, phoneNumber: phoneNumber, email: email, address: {street: street, city: city, state: state, zip: zip}, insurance: insurance};
    console.log(data);
    fetch('/update/patient/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        console.log(result.status);
        closeForm();
        fetchPatients();
    })
    .catch(() => {
        //Create an error message on the login page
        console.log("Error");
    });
}

// delete a patient 
function removePatient(button) {
    let buttonId = button.id;
    if (!buttonId.endsWith('-delete')) {
        console.log("Invalid button id");
        return;
    }
    const id = buttonId.slice(0, buttonId.length - 7);

    let data = {Id: id};

    fetch('/remove/patient/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Success"){
            console.log("Patient removed");
            fetchPatients();
        }
        else{
            console.log(text);
        }
    })
    .catch(() => {
        console.log("Error");
    });
}

// search patients 
function searchPatient() {
    console.log("Searching for patient...");
    var name = document.getElementById("name").value; 
    var dateOfBirth = document.getElementById("patientDoB").value; 

    const queryParams = new URLSearchParams({
        name: name,
        dateOfBirth: dateOfBirth
    });

    fetch(`/search/patient/?${queryParams.toString()}`, {
        method: 'GET'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error("Patient not found");
        }
    })
    .then(data => {
        console.log("Search results:", data);
        if (data.patient) { 
            // Populate the found patient form with the retrieved patient details
            let firstResult = data.patient[0];
            document.getElementById("foundPatientName").value = firstResult.name;
            document.getElementById("foundPatientDoB").value = firstResult.dateOfBirth;
            document.getElementById("foundPatientPhone").value = firstResult.phoneNumber;
            document.getElementById("foundPatientEmail").value = firstResult.email;
            document.getElementById("foundPatientAddress").value = `${firstResult.address.street}, ${firstResult.address.city}, ${firstResult.address.state}, ${firstResult.address.zip}`;
            document.getElementById("foundPatientInsurance").value = firstResult.insurance;

            // Show the found patient form
            document.getElementById("patientFoundForm").style.display = "flex";
            // document.getElementById("patientList").style.display = "none"; // Hide the patient list
        } else {
            // No patient found
            showNoPatientFoundPopup();
        }
    })
    .catch(error => {
        console.error('Error searching for patient:', error);
        showNoPatientFoundPopup();
    }).finally(() => {
        // Clear input boxes after searching
        document.getElementById("name").value = "";
        document.getElementById("patientDoB").value = "";
    });
}

// Function to close the popup 
function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}

// one form for both adding and updating - submit button functionality changes depending on how it's called
function openForm(num) {
    const e = document.getElementById("submit-btn");
    e.onclick = null;
    // add patient 
    if (num === 1){
        document.getElementById("patientName").value = "";
        document.getElementById("dob").value = "";
        document.getElementById("phoneNumber").value = "";
        document.getElementById("email").value = "";
        document.getElementById("street").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";
        document.getElementById("zip").value = "";
        document.getElementById("insurance").value = "";
        e.addEventListener("click", function() {
            addPatient()
        })
    }
    // update patient 
    if (num === 2){
        e.addEventListener("click", function() {
            sendPatientUpdates(e)
        })
    }
    document.getElementById("patientForm").style.display = "flex";
}

// close form 
function closeForm() {
    document.getElementById("patientForm").style.display = "none";
}

// open found patient popup
function openFoundPatient() {
    document.getElementById("patientFoundForm").style.display = "flex";
}

// Function to close the found patient form
function closeFoundPatient() {
    document.getElementById("patientFoundForm").style.display = "none";
    // document.getElementById("patientList").style.display = "block";
}

// Function to show the no patient found popup
function showNoPatientFoundPopup() {
    document.getElementById("noPatientFoundForm").style.display = "flex";
    // document.getElementById("patientList").style.display = "none"; // Hide the patient list
}

// Function to close the no patient found popup
function closeNoPatientFound() {
    document.getElementById("noPatientFoundForm").style.display = "none";
    // document.getElementById("patientList").style.display = "block"; // Show the patient list again
}

// close see prescriptions form 
function closeSeePrescriptions() {
    document.getElementById("seePrescriptionsForm").style.display = "none";
    // document.getElementById("patientList").style.display = "block"; // Show the patient list again
}

// open see prescriptions form
function openSeePrescriptions(e) {
    let id = e.id.split("-")[0];

    fetch(`/prescriptions/bypatient?id=` + id, {
        method: 'GET'
    })
    .then((response) => {
        return response.text();  
    })
    .then((message) => {
        document.getElementById("prescriptionsList").innerHTML = message;  
    })
    .catch((error) => {
        console.error('Error fetching patients:', error);
    });

    document.getElementById("seePrescriptionsForm").style.display = "flex";
}

// for filling prescription - open confirm popup
async function confirmFillPrescription(e) {
    closeSeePrescriptions();
    document.getElementById("confirmFill").style.display = "flex";
    let prescription = await findById(e);
    prescription = JSON.parse(prescription);
    document.getElementById("fillButton").addEventListener("mousedown", function() {
        fillPrescription(prescription);
    });
    document.getElementById("presName").innerHTML = prescription.patientName;
    document.getElementById("presDate").innerHTML = prescription.dateCreated;
    document.getElementById("presMedication").innerHTML = prescription.medication;
    document.getElementById("presQuantity").innerHTML = prescription.quantity;
}

// fill the prescription if medicine available 
async function fillPrescription(prescription) {
    let name = prescription.medication;
    let quantity = prescription.quantity;
    fetch('/find/medicine?name=' + name + '&quantity=' + quantity)
    .then(function(response) {
        return response.text();
    })
    .then((message) => {
        if (message == "<p>Medication unavailable</p>") {
            document.getElementById("errorMessages").innerHTML = message;
        }
        else {
            let medicine = JSON.parse(message);
            console.log(medicine);
            updateMedicineQuantity(medicine, quantity);
            updatePrescriptionStatus(prescription, "Ready");
            closeFillForm();
        }
    })
}

// close fill form
function closeFillForm() {
    document.getElementById("confirmFill").style.display = "none";
    document.getElementById("errorMessages").innerHTML = "";
}

// find prescription by id - needed for filling it
async function findById(e) {
    let id = e.id.split('-')[0];
    console.log(id);
    try {
        const response = await fetch('/prescriptions/byid?id=' + id);
        const message = await response.text();
        
        if (message == "<p>Error fetching prescription</p>") {
            document.getElementById("errorMessages").innerHTML = message;
            return null; // or handle the error as needed
        } else {
            return message;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return null; // or handle the error as needed
    }
}

// update medicine quantity on prescription filling
function updateMedicineQuantity(medicine, quantity) {
    var id = medicine._id;
    var name = medicine.name;
    var quantity = medicine.quantity - quantity;
    var expirationDate = medicine.expirationDate;

        let data = {id: id, name: name, quantity: quantity, expirationDate: expirationDate};
        fetch('/update/medicine/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {"Content-Type": "application/json"}     
        })
        .then((result) => {
            return result.text();
        }).then((text) => {
            if (text == "Saved"){
                console.log("Medicine updated");
            }
            else{
                //Create an error message on the login page
                console.log("Error");
            }
        })
        .catch(() => {
            //Create an error message on the login page
            console.log("Error");
        });
}

// update the prescription status when a prescription is filled 
function updatePrescriptionStatus(prescription, status) {
    let id = prescription._id;
    fetch('/update/prescription?id=' + id + '&status=' + status, {method: 'POST'})
    .then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Saved"){
            console.log("Medicine updated");
        }
        else{
            //Create an error message on the login page
            console.log(text);
        }
    })
    .catch(() => {
        //Create an error message on the login page
        console.log("Error");
    });
}