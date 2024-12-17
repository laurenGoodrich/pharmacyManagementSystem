// for logging
let insuranceCovered = null;
let selectedPatientId = null;

// on document load
document.addEventListener("DOMContentLoaded", function() {
    // add this function to the search bar to search whenever user enters input
    document.getElementById("patient-name").addEventListener('input', async function() {
        const query = this.value;

        if (query.length < 3) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/search/patient?name=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.message === 'Success') {
                const suggestionsList = document.getElementById('suggestions');
                suggestionsList.innerHTML = '';

                data.patient.forEach(patient => {
                    const li = document.createElement('li');
                    li.textContent = `${patient.name} - ${new Date(patient.dateOfBirth).toLocaleDateString()}`;
                    li.addEventListener('click', () => {
                        document.getElementById('patient-name').value = patient.name;
                        suggestionsList.innerHTML = ''; 
                        selectedPatientId = patient._id;
                        fetchPatientPrescriptions(patient._id); // Call the function to load prescriptions for that patient
                    });
                    suggestionsList.appendChild(li);
                });
            } else {
                document.getElementById('suggestions').innerHTML = ''; 
            }
        } catch (error) {
            console.error('Error fetching patient suggestions:', error);
        }
    });
});

// get dropdown of patients 
async function searchPatientSuggestions() {
    const patientName = document.getElementById('patient-name').value;

    if (patientName.length > 1) { 
        try {
            const response = await fetch(`/search/patient?name=${patientName}`);
            const data = await response.json();
            console.log('searching');
            console.log("Fetched data:", data); // Add this line

            if (data.message === 'Success') {
                console.log('sending');
                populatePatientSuggestions(data.patient);
                
            } else {
                document.getElementById('suggestions').innerHTML = ''; 
            }
        } catch (error) {
            console.error('Error fetching patient suggestions:', error);
        }
    }
}

// set patients dropdown visible + populate
function populatePatientSuggestions(patients) {
    if (!Array.isArray(patients)) {
        console.error("Expected an array but got:", patients);
        return;
    }
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';
    console.log('populating');
    patients.forEach(patient => {
        
        const suggestionItem = document.createElement('li');
        suggestionItem.textContent = `${patient.name} - ${new Date(patient.dateOfBirth).toLocaleDateString()}`;
        suggestionItem.style.cursor = 'pointer';
        suggestionItem.onclick = () => {
            console.log("Patient ID:", patient._id);
            selectPatient(patient._id, patient.name);
        };
        suggestionsList.appendChild(suggestionItem);
    });
}

// select a patient to get prescriptions for 
function selectPatient(patientId, patientName) {
    selectedPatientId = patientId;
    console.log("Selected patient ID:", selectedPatientId);
    document.getElementById('patient-name').value = patientName; 
    document.getElementById('suggestions').innerHTML = ''; 
    fetchPatientPrescriptions(patientId); 
}

// get prescriptions
async function fetchPatientPrescriptions(patientId) {
    try {
        const response = await fetch(`/prescriptions?patientId=${patientId}&status=Ready`);
        const data = await response.json();
        console.log('fetching prescriptions');

        if (data.message === 'Success') {
            populatePrescriptionTable(data.prescriptions);
        } else {
            alert('No filled prescriptions found');
            document.getElementById('prescriptionTable').innerHTML = ''; // Clear table if no prescriptions found
        }
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
    }
}

// populate prescriptions table with prescriptions ready for checkout for that patient
function populatePrescriptionTable(prescriptions) {
    let tableHTML = '<table><tr><th>Prescription Name</th><th>Quantity</th><th>Action</th></tr>';

    prescriptions.forEach(prescription => {
        tableHTML += `<tr>
            <td>${prescription.medication}</td>
            <td>${prescription.quantity}</td>
            <td><button onClick="addToCart('${prescription._id}', '${prescription.medication}', ${prescription.quantity})">Add to Cart</button></td>
        </tr>`;
    });

    tableHTML += '</table>';
    document.getElementById('prescriptionTable').innerHTML = tableHTML;
}

// open add nonprescription items form
function openAddItem() {
    document.getElementById("addItemForm").style.display = "flex";
}

// close add nonprescription item form
function closeAddItem() {
    document.getElementById("addItemForm").style.display = "none";

}

// open payment form
function openPayment() {
    document.getElementById("paymentForm").style.display = "flex";
    updatePaymentCartUI();
    document.querySelectorAll("input[name='paymentType']").forEach((input) => {
        input.addEventListener('change', togglePaymentForm);
    });
}

//close payment form
function closePayment() {
    document.getElementById("paymentForm").style.display = "none";

}

// toggle between prescription and nonprescription item 
function toggleFields() {
    const itemType = document.getElementById("itemType").value;
    const prescriptionField = document.getElementById("prescriptionField");
    const nonprescriptionField = document.getElementById("nonprescriptionField");

    if (itemType === "prescriptionItem") {
        prescriptionField.style.display = "flex";
        nonprescriptionField.style.display = "none";
    } else if (itemType === "nonprescriptionItem") {
        prescriptionField.style.display = "none";
        nonprescriptionField.style.display = "flex";
    } else {
        prescriptionField.style.display = "none";
        nonprescriptionField.style.display = "none";
    }
}

// update cart ui on page load
document.addEventListener("DOMContentLoaded", function() {
    updateCartUI();
});

// add item to cart (nonprescription item)
function addItem() {
    console.log("Calling add item");
    
    var itemType = document.getElementById("nonprescriptionField").value;
    itemType === "nonprescriptionItem" 

        console.log("Adding a nonprescription item");

        // Logic for adding a nonprescription item
        var category = document.getElementById("category").value;
        var itemName = document.getElementById("itemName").value;
        var quantity = document.getElementById("quantity").value;
        var price = document.getElementById("price").value;

        let data = {
            category: category,
            itemName: itemName,
            quantity: quantity,
            price: price
        };

        console.log("Data to be sent:" + data);

        fetch('/add/nonprescription/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {"Content-Type": "application/json"}
        })
        .then((result) => {
            return result.text();
        })
        .then((text) => {
            if (text === "Success") {
                console.log("Nonprescription item added successfully");

                // Call addToCart to add this item to the shopping cart
                addNonPrescriptionToCart(null, itemName, quantity, "nonprescription", price);
                
            } else {
                console.log("Failed to add nonprescription item:", text);
            }
        })
        .catch((error) => {
            console.log("Error adding nonprescription item:", error);
        });
        updateCartUI();
        updatePaymentCartUI();

        document.getElementById("category").value ='';
        document.getElementById("itemName").value ='';
        document.getElementById("quantity").value ='';
        document.getElementById("price").value ='';

        closeForm();
    
}

// add the added item above to shopping cart
function addNonPrescriptionToCart(itemId, itemName, quantity, itemType, price) {
    const data = {
        patientId: selectedPatientId, // Make sure this is defined as the current patient ID
        itemType: itemType,
        itemId: itemId,  // null if not a prescription
        itemName: itemName,
        quantity: quantity,
        price: price
    };

    fetch('/add-to-cart', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.text())
    .then(text => {
        if (text === "Item added to cart successfully.") {
            console.log("Item added to cart successfully.");
            updateCartUI();  // Update the cart UI to reflect the new item
            updatePaymentCartUI();
        } else {
            console.log("Failed to add item to cart:", text);
        }
    })
    .catch(error => {
        console.error("Error adding item to cart:", error);
    });
}

// close addItem form
function closeForm() {
    document.getElementById("addItemForm").style.display = "none";
}

// remove a nonprescription item
function removeNonPrescriptionItems(button) {
    if (!button || !button.id) {
        console.error("Button ID is undefined");
        return;
    }

    let buttonId = button.id;
    console.log("Button ID:", buttonId);

    // Ensure button ID ends with '-remove' to validate the ID format
    if (!buttonId.endsWith('-remove')) {
        console.log("Invalid button id");
        return;
    }

    // Extract the item ID from the button ID (assuming format: <item_id>-remove)
    const itemId = buttonId.split("-")[0];

    // Create data object for the server request
    let data = { itemId: itemId };

    fetch('/remove/nonPrescriptionItem', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }     
    })
    .then((result) => result.text())
    .then((text) => {
        if (text === "Success") {
            console.log("Non-Prescription item removed");
            updateCartUI();
            updatePaymentCartUI(); // Refresh the cart display
        } else {
            console.log("Error:", text);
        }
    })
    .catch((error) => {
        console.error("Error removing prescription item:", error);
    });

}

//remove a prescription item
function removePrescriptionItems(button) {
    if (!button || !button.id) {
        console.error("Button ID is undefined");
        return;
    }

    let buttonId = button.id;
    console.log("Button ID:", buttonId);

    // Ensure button ID ends with '-remove' to validate the ID format
    if (!buttonId.endsWith('-remove')) {
        console.log("Invalid button id");
        return;
    }

    // Extract the item ID from the button ID (assuming format: <item_id>-remove)
    const itemId = buttonId.split("-")[0];

    // Create data object for the server request
    let data = { itemId: itemId };

    fetch('/remove/prescriptionItem', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }     
    })
    .then((result) => result.text())
    .then((text) => {
        if (text === "Success") {
            console.log("Prescription item removed");
            updateCartUI(); // Refresh the cart display
            updatePaymentCartUI();
        } else {
            console.log("Error:", text);
        }
    })
    .catch((error) => {
        console.error("Error removing prescription item:", error);
    });

}

let shoppingCart = {
    prescriptionItems: [],
    nonPrescriptionItems: []
};

// insurance check for adding prescription from the checkout page
function openInsuranceCheck(prescriptionId, medicineName, quantity) {
    // Save the details of the item being added
    document.getElementById("insuranceCheckForm").dataset.prescriptionId = prescriptionId;
    document.getElementById("insuranceCheckForm").dataset.medicineName = medicineName;
    document.getElementById("insuranceCheckForm").dataset.quantity = quantity;
    document.getElementById("insuranceCheckForm").style.display = "flex"; // Show the form
}

// Trigger add to cart with insurance check
function addToCart(prescriptionId, medicineName, quantity) {
    openInsuranceCheck(prescriptionId, medicineName, quantity);
}

// Confirm add to cart after insurance check
async function confirmAddToCart() {
    console.log("confirmAddToCart called"); // Debugging log

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
    const isInsuranceCovered = insuranceCovered;

    // Set final price based on insurance status
    const finalPrice = isInsuranceCovered ? 0.00 : parseFloat(document.getElementById("manualPrice").value);

    // Validate if the price is a number when insurance is not covered
    if (!isInsuranceCovered && (isNaN(finalPrice) || finalPrice <= 0)) {
        alert("Please enter a valid price.");
        return;
    }

    // Define the payload to send to the server
    const cartItem = {
        patientId: selectedPatientId,
        itemType: "prescription",
        itemId: prescriptionId,
        itemName: medicineName,
        quantity: quantity,
        price: finalPrice,
    };

    console.log("Sending cart item to server:", cartItem); // Debugging log

    try {
        // Send item data to the server to be added to the cart
        const addResponse = await fetch('/add-to-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartItem),
        });

        if (addResponse.ok) {
            console.log("Item added to cart successfully.");
            updateCartUI();
            updatePaymentCartUI();
        } else {
            console.error("Failed to add item to cart.");
        }
    } catch (error) {
        console.error("Error adding item to cart:", error);
    }

    closeInsuranceCheck();
}

// UI update for cart
async function updateCartUI() {
    const cartSection = document.getElementById("cartSection");
    console.log("Fetching cart from database...");

    try {
        // Fetch the cart for the selected patient from the server
        const response = await fetch(`/get-cart`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch cart data from server.");
        }

        // Parse the cart data
        const cartData = await response.json();

        if (!cartData || (!cartData.prescriptionItems.length && !cartData.nonPrescriptionItems.length)) {
            cartSection.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }

        // Construct the cart table HTML from the fetched data
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add prescription items
        cartData.prescriptionItems.forEach(item => {
            const itemId = item._id?.$oid || item.id?.$oid || item._id || item.id; 

        if (!itemId) {
            console.error("Item ID is missing"); 
            return;
        }
            console.log("Item ID:", item._id); 
            tableHTML += `
                <tr>
                    <td>Prescription: ${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><button id="${item._id}-remove" onClick="removePrescriptionItems(this)">Remove</button></td>
                </tr>
            `;
            console.log(`Generated button with ID: ${item._id}-remove`);
        });

        

        // Add non-prescription items
        cartData.nonPrescriptionItems.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><button id="${item._id}-remove" onClick="removeNonPrescriptionItems(this)">Remove</button></td>
                </tr>
            `;
        });

        const totalSum = [...cartData.prescriptionItems, ...cartData.nonPrescriptionItems].reduce((sum, item) => sum + item.price * item.quantity, 0);

        tableHTML += `
                </tbody>
                <tfoot>
                    <td colspan="3">Total:</td>
                    <td>$${Number.parseFloat(totalSum).toFixed(2)}</td>
                </tfoot>
            </table>
            <button class="open-button" onclick="openPayment()">Check Out</button>
        `;

        // Set the cart HTML
        cartSection.innerHTML = tableHTML;

        
    } catch (error) {
        console.error("Error updating cart UI:", error);
        cartSection.innerHTML = '<p>Error loading cart.</p>';
    }
}

// Function to handle insurance status
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
}

// handle checkout and create receipt 
async function checkout(change) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);

    try {
        const infoResponse = await fetch('/info');
        if (!infoResponse.ok) {
            throw new Error('Network response was not ok ' + infoResponse.statusText);
        }
    
        const infoData = await infoResponse.json(); 
        doc.text(`${infoData.name}\n${infoData.address.street}\n${infoData.address.city}, ${infoData.address.state} ${infoData.address.zip}\n${infoData.phoneNumber}`, 140, 10);

        // Fetch the cart for the selected patient from the server
        const response = await fetch(`/get-cart`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch cart data from server.");
        }

        // Parse the cart data
        const cartData = await response.json();

        if (!cartData || (!cartData.prescriptionItems.length && !cartData.nonPrescriptionItems.length)) {
            cartSection.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }

        // Create and download receipt 
        var header = ['Item', 'Quantity', 'Price']
        var rows = [...cartData.prescriptionItems, ...cartData.nonPrescriptionItems].map(item => [item.name, item.quantity, `$${item.price.toFixed(2)}`]);

        const totalSum = [...cartData.prescriptionItems, ...cartData.nonPrescriptionItems].reduce((sum, item) => sum + item.price * item.quantity, 0);

        doc.autoTable({
            head: [header],
            body: rows,
            startY: 35, 
            theme: 'striped', 
            headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        });

        let x = 15;
        let y = doc.lastAutoTable.finalY + 10;
        doc.text("Total:", x, y);
        doc.text("$" + Number.parseFloat(totalSum).toFixed(2), x + 40, y);
        doc.text("Change:", x, y + 10)
        doc.text("$" + Number.parseFloat(change).toFixed(2), x + 40, y + 10);

        doc.save("receipt.pdf");

        try {
            // For logging financial transactions
            const transactionDetails = [
                ...cartData.prescriptionItems.map(item => ({
                    itemName: item.name,
                    quantity: item.quantity,
                    price: item.price.toFixed(2),
                    type: 'Prescription'
                })),
                ...cartData.nonPrescriptionItems.map(item => ({
                    itemName: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    type: 'Non-Prescription'
                }))
            ];

            const transaction = {
                totalAmount: parseFloat(totalSum),
                details: transactionDetails
            };

            console.log(transaction);

            await logFinancialTransaction(transaction);

        } catch (error) {
            console.error("Error logging financial transaction:", error);
            alert('Error logging financial transaction.');
        }

        emptyCart();
        updateCartUI();

    } catch (error) {
        console.error("Error fetching cart:", error);
        alert('Error loading cart.');
    }
}

// on purchase, clear the cart 
async function emptyCart() {
    try {
        // Fetch the cart for the selected patient from the server
        const response = await fetch(`/get-cart`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch cart data from server.");
        }

        // Parse the cart data
        const cartData = await response.json();

        cartData.prescriptionItems.forEach( async (prescription) => {
            try {
                const prescriptionId = prescription.id._id.toString();
        
                const res = await fetch('/prescriptions/byid?id=' + prescriptionId);
                const message = await res.text();
                const prescriptionData = JSON.parse(message);
        
                updatePrescriptionStatus(prescriptionData, "Completed");
            } catch (error) {
                console.error('Error processing prescription:', error);
            }
        });

        fetch('/completeCheckout', {method: 'POST'})
        .then((result) => {
            return result.text();
        }).then((text) => {
            if (text == "Checkout completed and cart removed"){
                console.log("Cart removed");
                updateCartUI();
            }
            else{
                console.log("Error");
            }
        })
        .catch(() => {
            console.log("Error");
        });
    } catch (error) {
        console.error("Error emptying cart:", error);
        alert('Error emptying cart.');
    }
}

// update status of picked up prescriptions 
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

// update payment cart UI - popup on payment 
async function updatePaymentCartUI() {
    const cartSection = document.getElementById("paymentCartSection");
    console.log("Fetching cart from database...");

    try {
        // Fetch the cart for the selected patient from the server
        const response = await fetch(`/get-cart`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch cart data from server.");
        }

        // Parse the cart data
        const cartData = await response.json();

        if (!cartData || (!cartData.prescriptionItems.length && !cartData.nonPrescriptionItems.length)) {
            cartSection.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }

        // Construct the cart table HTML from the fetched data
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add prescription items
        cartData.prescriptionItems.forEach(item => {
            const itemId = item._id?.$oid || item.id?.$oid || item._id || item.id; // Adjust based on structure

        if (!itemId) {
            console.error("Item ID is missing"); // Log if ID is still undefined
            return;
        }
            console.log("Item ID:", item._id); 
            tableHTML += `
                <tr>
                    <td>Prescription: ${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><button id="${item._id}-remove" onClick="removePrescriptionItems(this)">Remove</button></td>
                </tr>
            `;
            console.log(`Generated button with ID: ${item._id}-remove`);
        });

        

        // Add non-prescription items
        cartData.nonPrescriptionItems.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><button id="${item._id}-remove" onClick="removeNonPrescriptionItems(this)">Remove</button></td>
                </tr>
            `;
        });

        const totalSum = [...cartData.prescriptionItems, ...cartData.nonPrescriptionItems].reduce((sum, item) => sum + item.price * item.quantity, 0);

        tableHTML += `
                </tbody>
                <tfoot>
                    <td colspan="3">Total:</td>
                    <td id="payment-total">$${Number.parseFloat(totalSum).toFixed(2)}</td>
                </tfoot>
            </table>
        `;

        if (totalSum === 0) {
            document.getElementById("payment-options").style.display = "none";
        }
        else {
            document.getElementById("payment-options").style.display = "flex";
            document.getElementById("payment-options").style.flexDirection = "column";
            document.getElementById("payment-options").style.alignItems = "center";
        }

        // Set the cart HTML
        cartSection.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error updating cart UI:", error);
        cartSection.innerHTML = '<p>Error loading cart.</p>';
    }
}

// make payment form visible 
function togglePaymentForm(e) {
    const paymentInput = document.getElementById('paymentInput');
    switch (e.target.id) {
        // for entering cash amount
        case 'cashRadio':
            paymentInput.innerHTML = `
                <form id="payment-info">
                    <label for="cashAmount">Amount: $</label>
                    <input type="text" id="cashAmount" required>
                </form>
            `;
            break;
        // for getting credit/debit info
        case 'debitRadio':
        case 'creditRadio':
            paymentInput.innerHTML = `
                <form id="payment-info">
                    <table>
                        <tr>
                            <td><label for="cardNumber">Card Number</label></td>
                            <td><input type="text" id="cardNumber" required></td>
                        </tr>
                        <tr>
                            <td><label for="expiryDate">Expiry Date</label></td>
                            <td><input type="text" id="expiryDate" placeholder="MM/YY" required></td>
                        </tr>
                        <tr>
                            <td><label for="cvv">CVV</label></td>
                            <td><input type="text" id="cvv" required></td>
                        </tr>
                        <tr>
                            <td><label for="nameOnCard">Name on Card</label></td>
                            <td><input type="text" id="nameOnCard" required></input></td>
                        </tr>
                    </table>
                </form>
            `
            break;
        default:
            break;
    }
}

// for logging a financial transaction
async function logFinancialTransaction(transaction) {
        console.log("Logging financial transaction:", transaction);
    
        try {
            const response = fetch('/log/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
    
            if (!response.ok) {
                throw new Error("Failed to log financial transaction.");
            }
    
            console.log("Transaction logged successfully.");
        } catch (error) {
            console.error("Error logging financial transaction:", error);
        }
}

// validate payment info 
function validatePayment() {
    let total = document.getElementById("payment-total").innerText;
    try {
        total = Number.parseFloat(total.split("$")[1]);
        if (total == 0) {
            checkout(0);
            closePayment();
            updateCartUI();
        }
        else {
            let paymentType = Array.from(document.getElementsByName("paymentType")).find(r => r.checked);
            console.log(`PAYMENT TYPE: '${paymentType}'`)
            if (!paymentType) {
                alert('No payment type selected!');
            }
            else {
                paymentType = paymentType.id;
                const form = document.getElementById('payment-info');
                if (form.checkValidity()) {
                    switch (paymentType) {
                        case 'cashRadio':
                            let cashAmount = Number.parseFloat(document.getElementById('cashAmount').value);
                            let total = Number.parseFloat(document.getElementById('payment-total').innerText.split('$')[1]);
                            let change = (cashAmount - total).toFixed(2);
                            if (change < 0) {
                                alert('Not enough cash!');
                                return;
                            }
                            if (confirm(`Change: ${change}`)) {
                                checkout(change);
                                closePayment();
                                updateCartUI();
                            }
                            break;
                        case 'debitRadio':
                        case 'creditRadio':
                            if (confirm('Confirm checkout')) {
                                checkout(0);
                                closePayment();
                                updateCartUI();
                            }
                            break;
                    }
                } else {
                    form.reportValidity();
                }
            }
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}