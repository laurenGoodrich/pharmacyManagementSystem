
function getActivePrescriptions() {
    console.log("Getting active prescriptions");
    fetch('/prescriptions/active')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("prescriptionsList").innerHTML = message;
    });
}

function getFilledPrescriptions() {
    console.log("Getting ready prescriptions");
    fetch('/prescriptions/ready')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("prescriptionsList").innerHTML = message;
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // load active prescriptions on startup
    getActivePrescriptions();

    //Add search function to this element to get input whenever the user types somethign
    document.getElementById("patientName").addEventListener('input', async function() {
        const query = this.value;
        console.log(query);
    
        if (query.length < 0) {
            document.getElementById('patientSuggestions').innerHTML = '';
            return;
        }
    
        try {
            const response = await fetch(`/search/patient?name=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            
            const suggestionsList = document.getElementById('patientSuggestions');
            suggestionsList.innerHTML = '';
            
            if (suggestions['patient']) {
                suggestions['patient'].forEach(item => {
                    const li = document.createElement('li');
                    console.log(item.name);
                    li.textContent = item.name;
                    console.log("CREATING EVENT LISTENER");
                    li.addEventListener('click', () => {
                        document.getElementById('patientName').value = item.name; // Set the value of the search bar
                        suggestionsList.innerHTML = ''; // Clear suggestions
                    });
                    suggestionsList.appendChild(li);
                });
            }
            else {
                const li = document.createElement('li')
                li.textContent = "No results found";
                li.addEventListener('click', () => {
                    document.getElementById('patientName').value = ""; // Set the value of the search bar
                    suggestionsList.innerHTML = ''; // Clear suggestions
                });
                suggestionsList.appendChild(li);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    });
});

async function addPrescription() {
    //Get inputs from document input boxes
    var patientName = document.getElementById("patientName").value;
    // var date = document.getElementById("dateCreated").value;
    var date = new Date().toISOString().split('T')[0];
    var medication = document.getElementById("medication").value;
    var quantity = document.getElementById("quantity").value;

    //Check for valid patient name
    const query = patientName;
    const response = await fetch(`/match/patient?name=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    if (suggestions['patient']) {
        let data = {patientName: patientName, dateCreated: date, medication: medication, quantity: quantity, patientID: suggestions['patient'][0]._id};
        fetch('/add/prescription/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {"Content-Type": "application/json"}     
        })
        .then((result) => {
            return result.text();
        }).then((text) => {
            if (text == "Success"){
                console.log("Prescription added");
            }
            else{
                console.log(text);
            }
        })
        .catch(() => {
            console.log("Error adding prescription");
        });
        closeAddForm();
        getActivePrescriptions();
    } else {
        alert("Patient not found");
    }
}

// Form to add a prescription
function openAddForm() {
    document.getElementById("addForm").style.display = "flex";
}
  
function closeAddForm() {
    document.getElementById("addForm").style.display = "none";
    for (child in document.getElementById("addForm").children) {
        child.value = "";
    }

    if (document.getElementById("main-prescriptions").classList.contains("active")){
        getActivePrescriptions();
    }
    else {
        getFilledPrescriptions();
    }
}


function closeFillForm() {
    document.getElementById("confirmFill").style.display = "none";
    document.getElementById("errorMessages").innerHTML = "";
    for (child in document.getElementById("addForm").children) {
        child.value = "";
    }
    getActivePrescriptions();
}

// confirmation of filling form
async function confirmFillPrescription(e) {
    let prescription = await findById(e);
    prescription = JSON.parse(prescription);
    document.getElementById("fillButton").addEventListener("mousedown", function() {
        fillPrescription(prescription);
    });
    document.getElementById("presName").innerHTML = prescription.patientName;
    document.getElementById("presDate").innerHTML = prescription.dateCreated;
    document.getElementById("presMedication").innerHTML = prescription.medication;
    document.getElementById("presQuantity").innerHTML = prescription.quantity;

    document.getElementById("confirmFill").style.display = "flex";
}

// Filling the prescription
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
            console.log("MEDICINE:" + medicine);
            console.log("PRESCRIPTION:" + prescription);
            updateMedicineQuantity(medicine, quantity);
            updatePrescriptionStatus(prescription, "Ready");
            closeFillForm();
            getActivePrescriptions();
        }
    })
}

// find prescription to fill
async function findById(e) {
    let id = e.id.split('-')[0];
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

// Update inventory on prescription fill
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

// For filling prescription - updates status
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
            console.log("Error");
        }
    })
    .catch(() => {
        //Create an error message on the login page
        console.log("Error");
    });
}

// Add to cart
function addToCart(prescriptionId, medicineName, quantity) {
    openInsuranceCheck(prescriptionId, medicineName, quantity);
}

// Form for asking about insurance
function openInsuranceCheck(prescriptionId, medicineName, quantity) {
    // Save the details of the item being added
    document.getElementById("insuranceCheckForm").dataset.prescriptionId = prescriptionId;
    document.getElementById("insuranceCheckForm").dataset.medicineName = medicineName;
    document.getElementById("insuranceCheckForm").dataset.quantity = quantity;
    document.getElementById("insuranceCheckForm").style.display = "flex"; // Show the form
}

// Function to handle insurance status + get price
function handleInsurance(hasInsurance) {
    insuranceCovered = hasInsurance;
    const manualPrice = document.getElementById("manualPrice");
    if (hasInsurance) {
        manualPrice.style.display = "none";
        document.getElementById("manualPriceLabel").style.display = "none";
    } else {
        manualPrice.style.display = "block";
        document.getElementById("manualPriceLabel").style.display = "block";
    }
}

// Close insurance check form
function closeInsuranceCheck() {
    document.getElementById("insuranceCheckForm").style.display = "none";
    document.getElementById("manualPrice").value = ""; // Reset manual price
    getFilledPrescriptions();
}

// Confirm add to cart after insurance check
async function confirmAddToCart() {
    console.log("confirmAddToCart called"); // Debugging log
    //console.log("Selected patient ID:", selectedPatientId);
    const form = document.getElementById("insuranceCheckForm");
    const prescriptionId = form.dataset.prescriptionId;
    const medicineName = form.dataset.medicineName;
    const quantity = parseInt(form.dataset.quantity);

    // Fetch the current cart to check if the item already exists
    try {
        const response = await fetch(`/get-cart`);
        if (!response.ok) {
            throw new Error("Failed to fetch cart data.");
        }

        const cartData = await response.json();

        // Debugging log: Show cart data
        console.log("Current cart data:", cartData);
        if (cartData) {
            // Check if the prescription item is already in the cart
            const itemExists = cartData.prescriptionItems.some(
            (item) => item.id?._id === prescriptionId || item._id === prescriptionId
            );

            if (itemExists) {
                alert(`${medicineName} is already in the cart.`);
                closeInsuranceCheck();
                return;
            }
        }
    } catch (error) {
        console.error("Error checking cart:", error);
        alert("An error occurred while checking the cart.");
        return;
    }
    
    // Determine if the item is covered by insurance
    const isInsuranceCovered = insuranceCovered; // This variable should be set by handleInsurance

    // Set final price based on insurance status
    const finalPrice = isInsuranceCovered ? 0.00 : parseFloat(document.getElementById("manualPrice").value);

    // Validate if the price is a number when insurance is not covered
    if (!isInsuranceCovered && (isNaN(finalPrice) || finalPrice <= 0)) {
        alert("Please enter a valid price.");
        return;
    }

    // Define the payload to send to the server
    const cartItem = { 
        itemType: "prescription",
        itemId: prescriptionId,
        itemName: medicineName,
        quantity: quantity,
        price: finalPrice
    };

    console.log("Sending cart item to server:", cartItem); // Debugging log

    try {
        // Send item data to the server to be added to the cart
        const response = await fetch('/add-to-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartItem)
        });

        if (response.ok) {
            console.log("Item added to cart successfully.");
            console.log("Current shopping cart");
        } else {
            console.error("Failed to add item to cart.");
        }
    } catch (error) {
        console.error("Error adding item to cart:", error);
    }

    closeInsuranceCheck(); // Close the insurance check form

}

// For the two tabs - active and filled
function loadTable(obj) {
    console.log("1");
    // Remove the 'active' class from all tabs
    const tabs = document.querySelectorAll('#headers-inner .tab-header');
    tabs.forEach((tab) => tab.classList.remove('active'));

    // Add the 'active' class to the clicked tab
    obj.classList.add('active');

    // Check the text content and call the corresponding function
    const tabText = obj.textContent.trim();
    if (tabText === "Active Prescriptions") {
        getActivePrescriptions();
    } else if (tabText === "Filled Prescriptions") {
        getFilledPrescriptions();
    }
}

// for search functionality
function searchMedicines(){
    const text = document.getElementById("searchField").value;
    console.log("text " + text);
    fetch('/search/prescriptions?text=' + text, {
        method: 'GET',
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        return result.text();
    }).then((message) => {
        console.log(message);
        document.getElementById("prescriptionsList").innerHTML = message;
        
        const tabs = document.querySelectorAll('#headers-inner .tab-header');
        tabs.forEach((tab) => {
            tab.classList.remove('active');
            console.log(tab.classList);
        });
    })
    .catch(() => {
        console.log("Error");
    });
}

//For making sure that the user is done typing before search results are displayed
const debounce = (mainFunction, delay) => {
    // Declare a variable called 'timer' to store the timer ID
    let timer;
  
    // Return an anonymous function that takes in any number of arguments
    return function (...args) {
      // Clear the previous timer to prevent the execution of 'mainFunction'
      clearTimeout(timer);
  
      // Set a new timer that will execute 'mainFunction' after the specified delay
      timer = setTimeout(() => {
        mainFunction(...args);
      }, delay);
    };
  };
  
const debouncedSearchMeds = debounce(searchMedicines, 500);
