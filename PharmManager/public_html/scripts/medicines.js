// This function fetches all medicines from the server and displayes them
function getMedicines() {
    console.log("Getting medicines");
    fetch('/medicines')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("medicines").innerHTML = message;
    });
}

// get expiring medicines to display (<30 days from now)
function getExpiringMedicines() {
    console.log("Getting medicines expiring soon");
    fetch('/medicines/expiring')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("medicines").innerHTML = message;
    });
}
// get low inventory medicines to display (<120)
function getLowInventory() {
    console.log("Getting medicines with low inventory");
    fetch('/medicines/lowinventory')
    .then((response) => {
        return response.text();
    })
    .then((message) => {
        document.getElementById("medicines").innerHTML = message;
    });
}

//Event listener for page loading to get medicines for table
document.addEventListener("DOMContentLoaded", function() {
    getMedicines();
});

/**
 * When the user clicks the submit button the medicine is added to the database
 * and it will be displayed the next time the medicines are gotten from the server
 */
function addMedicine() {
    //Get inputs from document input boxes
    var name = document.getElementById("name").value;
    var quantity = document.getElementById("quantity").value;
    var date = document.getElementById("expirationDate").value;

    let data = {name: name, quantity: quantity, expirationDate: date};
    console.log(data);
    fetch('/add/medicine/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}     
    }).then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Success"){
            const tabs = document.querySelectorAll('#headers-inner .tab-header');
            tabs.forEach((tab) => tab.classList.remove('active'));
            const mainSection = document.getElementById("main-inventory");
            mainSection.classList.add('active');

            getMedicines();
            closeForm();
        }
        else{
            console.log(text);
        }
    })
    .catch(() => {
        console.log("Error adding medicine");
    });
}

// update medicine - sets table items to be editable and makes save changes button visible 
function toggleUpdateMedicine(e) {
    let id = e.id.split("-")[0];
    let nameElem = document.getElementById(id + "-name");
    let quantityElem = document.getElementById(id + "-quantity");
    let expirationDateElem = document.getElementById(id + "-expiration");
    if (e.innerHTML == "Update") {
        quantityElem.removeAttribute('readonly');
        expirationDateElem.removeAttribute('readonly');
        document.getElementById(e.id).innerHTML = "Save Changes";
    }
    else if (e.innerHTML == "Save Changes") {
        quantityElem.setAttribute("readonly", "");
        expirationDateElem.setAttribute("readonly", "");
        document.getElementById(e.id).innerHTML = "Update";

        var name = nameElem.innerText;
        var quantity = quantityElem.value;
        var expirationDate = expirationDateElem.value;

        let data = {id: id, name: name, quantity: quantity, expirationDate: expirationDate};
        console.log(data);

        fetch('/update/medicine/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {"Content-Type": "application/json"}     
        })
        .then((result) => {
            return result.text();
        }).then((text) => {
            console.log("Response - " + text);
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
}

// delete a medicine 
function removeMedicine(button) {
    let buttonId = button.id;
    if (!buttonId.endsWith('-delete')) {
        console.log("Invalid button id");
        return;
    }
    const id = buttonId.slice(0, buttonId.length - 7);

    let data = {Id: id};

    fetch('/remove/medicine/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        return result.text();
    }).then((text) => {
        if (text == "Success"){
            console.log("Medicine removed");

            const tabs = document.querySelectorAll('#headers-inner .tab-header');
            tabs.forEach((tab) => tab.classList.remove('active'));

            const mainSection = document.getElementById("main-inventory");
            mainSection.classList.add('active');
            getMedicines();
        }
        else{
            console.log(text);
        }
    })
    .catch(() => {
        console.log("Error");
    });
}

// load table - for choosing which tab is active 
function loadTable(obj) {
    // Remove the 'active' class from all tabs
    const tabs = document.querySelectorAll('#headers-inner .tab-header');
    tabs.forEach((tab) => tab.classList.remove('active'));

    // Add the 'active' class to the clicked tab
    obj.classList.add('active');

    // Check the text content and call the corresponding function
    const tabText = obj.textContent.trim();
    if (tabText === "Inventory") {
        getMedicines();
    } else if (tabText === "Low Stock") {
        getLowInventory();
    } else if (tabText === "Expiring Soon") {
        getExpiringMedicines();
    }
}

// order more button - alerts user that more was orderedd
function orderMore(button){
    let buttonId = button.id;
    if (!buttonId.endsWith('-orderMore')) {
        console.log("Invalid button id");
        return;
    }
    const id = buttonId.slice(0, buttonId.length - 10);

    const name = document.getElementById(id + "-name").innerText;

    alert("Ordered more of " + name + " - it will arrive in 2-4 weeks");
}

// search functionality - searches by medicine name
function searchMedicines(){
    const text = document.getElementById("searchField").value;
    console.log("text " + text);
    fetch('/search/medicine?name=' + text, {
        method: 'GET',
        headers: {"Content-Type": "application/json"}     
    })
    .then((result) => {
        return result.text();
    }).then((message) => {
        document.getElementById("medicines").innerHTML = message;
        const tabs = document.querySelectorAll('#headers-inner .tab-header');
        tabs.forEach((tab) => tab.classList.remove('active'));

        const mainSection = document.getElementById("main-inventory");
        mainSection.classList.add('active');
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

// open add medicine form 
function openForm() {
    document.getElementById("medicineForm").style.display = "flex";
}

//close add medicine form
function closeForm() {
    document.getElementById("medicineForm").style.display = "none";
}