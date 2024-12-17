import express from "express";
import fs from "fs"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { medicines, prescriptions, patients, accounts, inventoryLog, shoppingCart, updates, nonPrescriptionItems, info, financialTransactions} from './schema.js';

//List of sessions for all the users currently logged in 
let sessions = [];

const prescriptionLog = fs.createWriteStream('./prescriptionLog.txt', { flags: 'a' }); 
const loginLog = fs.createWriteStream('./loginLog.txt', { flags: 'a' });

function logPrescription(message) {
    prescriptionLog.write(`${new Date().toISOString()} - ${message}\n`);
}

function logLogin(message) {
    loginLog.write(`${new Date().toISOString()} - ${message}\n`);
}

/**
 * This function adds a session to the session list for the user
 * @param {String} user - the username
 * @returns 
 */
function addSession(user, type){
    //Generates a random session id
    let sessionId = Math.floor(Math.random() * 100000);
    let sessionStart = Date.now();
    sessions[user] = { 'sid':sessionId, 'start':sessionStart, 'type':type };
    return sessionId;
}

/**
 * This function determines if the user has a session.
 * @param {String} user - username
 * @param {Number} sessionId - the session id
 * @returns 
 */
function doesUserHaveSession(user, sessionId, type, page){
    let entry = sessions[user];
    if (entry != undefined) {
        return [entry.sid == sessionId, allowedAccountTypes[page].includes(type)];
    }
    return false, false;
}

const SESSION_LENGTH = 3600000;

/**
 * This function deletes sessions that are expired.
 */
function cleanupSessions () {
  let currentTime = Date.now();
  for (let i in sessions) {
    let sess = sessions[i];
    if (sess.start + SESSION_LENGTH < currentTime){
      console.log("Removing session id")
      delete sessions[i];
    }
  }
}

setInterval(cleanupSessions, 2000);

// Sets permissions for each page by account type
const allowedAccountTypes = {
    'medicines': ["pharmacyManager"], 
    'patients': ["pharmacyManager", "pharmacist", "pharmacyTechnician"], 
    'accounts': ["pharmacyManager"], 
    'prescriptions': ["pharmacyManager", "pharmacist"], 
    'checkout': ["pharmacyManager", "pharmacist", "pharmacyTechnician", "cashier"],
    'home': ["pharmacyManager", "pharmacist", "pharmacyTechnician", "cashier"],
    'reports': ["pharmacyManager"],
}

/**
 * This function checks at every page load that the user has a valid session, and if not they 
 * are redirected to the login page.
 * @returns None
 */
function authenticate(req, res, next, page){
    console.log(`going to redirect, trying to do ${page}`);
    let c = req.cookies;
    console.log(c);
    if (c && c.login){
        let result = doesUserHaveSession(c.login.username, c.login.sid, c.login.type, page);
        if (result[0] && result[1]) {
            next();
            return;
        }
        if (result[0]){
            console.log("redirecting - no permissions for this page");
            res.redirect('/pages/home.html');
        }
    }
    console.log("redirecting");
    res.redirect('/pages/login.html');
}

const app = express();

app.use(cookieParser());

// Needed to pass the page in to check permissions
function authenticateWithParam(page) {
    return (req, res, next) => authenticate(req, res, next, page);
}

// Use the wrapper function with app.use to pass the page parameter
app.use('/pages/medicines.html', authenticateWithParam('medicines')); 
app.use('/pages/patients.html', authenticateWithParam('patients')); 
app.use('/pages/prescriptions.html', authenticateWithParam('prescriptions')); 
app.use('/pages/checkout.html', authenticateWithParam('checkout')); 
app.use('/pages/accounts.html', authenticateWithParam('accounts'));
app.use('/pages/home.html', authenticateWithParam('home'));
app.use('/pages/reports.html', authenticateWithParam('reports'));

app.use(express.static("../public_html"));
app.use(express.json())
app.use(cookieParser());


/*********************************************************************
LOGIN ROUTES
*********************************************************************/

const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_ATTEMPTS = 5; // Maximum allowed failed attempts

// Object to store failed login attempts
let failedAttempts = {};

let currentUser = null;


app.post('/login', (req, res) => {
    console.log("Called login");
    let u = req.body.username;
    let p = req.body.password;

    // Validate login credentials
    accounts.find({ username: u }).exec()
        .then((result) => {
            if (result.length == 1) {
                if (result[0].locked == true) {
                    console.log(`User locked out.`);
                    res.status(403).end("Too many failed attempts. Try again later.");
                }
                else if (result[0].password == p) {
                    // Successful login
                    const id = addSession(u, result[0].staffType);
                    currentUser = {username: u, type: result[0].staffType};
                    console.log("Logged in " + id);
                    res.cookie("login", { username: u, sid: id, type: result[0].staffType }, { maxAge: SESSION_LENGTH });
                    res.end("SUCCESS");
                    logLogin(`Login - User: ${u}, Role: ${result[0].staffType}`);
                    console.log(sessions);
    
                    // Reset failed attempts on success
                    delete failedAttempts[u];
                } else {
                    // Failed login attempt
                    console.log("Failure to log in");
                    if (!failedAttempts[u]) {
                        failedAttempts[u] = { count: 1 };
                        res.end("Failure to log in");
                    } else {
                        failedAttempts[u].count += 1;
    
                        // Check if user should be locked out
                        if (failedAttempts[u].count >= MAX_ATTEMPTS) {
                            console.log("User locked out after maximum attempts.");
                            accounts.findByIdAndUpdate(result[0]._id, { locked:true }, {new: true, upsert:true} ).exec()
                            .then(() => {
                                res.status(403).end("Too many failed attempts. Try again later.");
                            });
                        }
                        else {
                            res.end("Failure to log in");
                        }
                    }
                }
            }
            else {
                throw new Error("Non unique username");
            }
        })
        .catch((err) => {
            console.log(err);
            res.end("Failure to log in");
        });
});

// User logout
app.get('/logout', (req, res) => {
    console.log("Called logout");
    logLogin(`Logout - User: ${currentUser.username}, Role: ${currentUser.type}`);
    sessions = [];
    res.end("Sessions cleared");
});



/*********************************************************************
MEDICINE ROUTES
*********************************************************************/

//Get request to display all the medicines in the database
app.get('/medicines', (req,res) =>{
    let p = medicines.find({}).sort({name:"asc"}).exec();
    p.then( (results) => {
        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        for (let i in results) {
            resultString += "<tr><td id=" + results[i]._id.toString() + "-name>" + results[i].name + "</td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + String(results[i].quantity)
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-expiration readonly value=" + results[i].expirationDate + "></td><td><button type=button id=" + results[i]._id.toString() + "-update onClick=toggleUpdateMedicine(this)>Update</button></td><td>" +
            "<button onClick=removeMedicine(this) id=" + results[i]._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + results[i]._id.toString() + "-orderMore>Order More</button></td></tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    });
});

//Get expiring/expired medicines
app.get('/medicines/expiring', (req,res) => {
    // Get today's date and calculate the date 30 days from now
    const today = new Date();
    const dateIn30Days = new Date(today);
    dateIn30Days.setDate(today.getDate() + 30);

    // Convert dateIn30Days to a string in the same format as expirationDate
    const expirationDateString = dateIn30Days.toISOString().split('T')[0];
    let p = medicines.find({
        expirationDate: { $lte: expirationDateString }
    }).sort({expirationDate:"asc"}).exec();
    p.then(results => {
        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        for (let i in results) {
            // Parse expiration date and today into comparable formats (YYYY-MM-DD)
            const expirationDate = new Date(results[i].expirationDate);
            const isExpired = expirationDate < today;
            // Apply light red background if expired
            const rowStyle = isExpired ? "style='background-color: lightcoral;'" : "";
            resultString += "<tr " + rowStyle + "><td id=" + results[i]._id.toString() + "-name>" + results[i].name + "</td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + String(results[i].quantity)
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-expiration readonly value=" + results[i].expirationDate + "></td>" +
            "<td><button onClick=removeMedicine(this) id=" + results[i]._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + results[i]._id.toString() + "-orderMore>Order More</button></td></tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
});

// Medicines with <120 doses
app.get('/medicines/lowinventory', (req,res) => {
    let p = medicines.find({
        quantity: { $lte: 120 }
    }).sort({name:"asc"}).exec();
    p.then(results => {
        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        for (let i in results) {
            resultString += "<tr><td id=" + results[i]._id.toString() + "-name>" + results[i].name + "</td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + String(results[i].quantity)
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-expiration readonly value=" + results[i].expirationDate + "></td>" + 
            "<td><button onClick=removeMedicine(this) id=" + results[i]._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + results[i]._id.toString() + "-orderMore>Order More</button></td></tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
});

// Update a medicine
app.post('/update/medicine/', (req, res) =>{
    let { id, name, quantity, expirationDate } = req.body;

    medicines.findByIdAndUpdate(
        id,
        { quantity: quantity, expirationDate: expirationDate },
        { new: true }
    ).exec()
        .then(updatedMedicine => {
            if (!updatedMedicine) {
                res.end("Error - no medicine with that id found");
                return;
            }

            // Log the update in inventoryLog
            var logEntry = new inventoryLog({
                medicineName: updatedMedicine.name,
                quantity: quantity,
                expirationDate: expirationDate,
                action: "Updated"
            });

            return logEntry.save();
        })
        .then(() => {
            res.end("Saved");
        })
        .catch(err => {
            console.error(err);
            res.end("Error");
        });
});

//Creates a new medicine in the database
app.post('/add/medicine/', (req, res) =>{
    let n = req.body.name;
    let q = req.body.quantity;
    let d = req.body.expirationDate;

    var temp = new medicines({
        name: n,
        quantity: q,
        expirationDate: d
    });
    let p = temp.save();
    p.then( (doc) => {
        // Log the addition in inventoryLog
        var logEntry = new inventoryLog({
            medicineName: n,
            quantity: q,
            expirationDate: d,
            action: "Added"
        });

        return logEntry.save();
    })
    .then(() => {
        res.end("Success");
    })
    p.catch( (err) => {
        res.end("Error saving medicine");
    });
});

// Deletes a medicine from db
app.post('/remove/medicine/', (req, res) => {
    let id = req.body.Id;
    let p = medicines.findByIdAndDelete(id).exec();
    p.then(deletedUser => {
        if (!deletedUser) {
            res.end("Error - no medicine with that id found");
            return;
        } 

        //log the removal in inventoryLog
        var logEntry = new inventoryLog ({
            medicineName: deletedUser.name,
            quantity: deletedUser.quantity,
            expirationDate: deletedUser.expirationDate,
            action: "Deleted"
        });
        return logEntry.save();
    })
    .then(() => {
        res.end("Success");
    })
    .catch(err => {
        console.error(err);
        res.end("Error: " + err)
    });
});

//Find a medicine - used to fill prescriptions
app.get('/find/medicine', (req,res) => {
    let name = req.query.name;
    const quantity = req.query.quantity;
    const today = new Date();
    const todaysDate = new Date(today);
    const expirationDateString = todaysDate.toISOString().split('T')[0];

    let p = medicines.find({
        name: name,
        quantity: { $gte: quantity },
        expirationDate: { $gte: expirationDateString },
    }).sort({expirationDate: "asc"}).exec();
    p.then(results => {
        console.log(results);
        if (results.length > 0) {
            res.json(results[0]);
        }
        else {
            let resultString = "<p>Medication unavailable</p>";
            res.end(resultString);
        }
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
});

// For searching medicines functionality
app.get('/search/medicine', (req,res) => {
    let name = req.query.name;
    let p = medicines.find({
        name: { $regex: name, $options: 'i' },      //i is case insensitive
    }).sort({name: "asc"}).exec();
    p.then(results => {
        if (results.length > 0) {
            let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
            for (let i in results) {
                resultString += "<tr><td id=" + results[i]._id.toString() + "-name>" + results[i].name + "</td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + String(results[i].quantity)
                + "></td><td><input type=text id=" + results[i]._id.toString() + "-expiration readonly value=" + results[i].expirationDate + "></td><td><button type=button id=" + results[i]._id.toString() + "-update onClick=toggleUpdateMedicine(this)>Update</button></td><td>" +
                "<button onClick=removeMedicine(this) id=" + results[i]._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + results[i]._id.toString() + "-orderMore>Order More</button></td></tr>";
            }
            resultString += "</table>";
            res.end(resultString);
        }
        else {
            let resultString = "<p id=no-medicines>No medicines found</p>";
            res.end(resultString);
        }
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
});

/*********************************************************************
REPORT ROUTES
*********************************************************************/
// For generating inventory report
app.get('/inventory/logs', (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(startDate);

    inventoryLog.find({
        actionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    })
    .sort({ actionDate: 1 }) // Sort by action date
    .exec()
    .then(logs => {
        res.json(logs);
    })
    .catch(err => {
        console.error("Error fetching inventory logs:", err);
        res.status(500).send("Error fetching logs.");
    });
});

// Log purchase transaction
app.post('/log/transaction', async (req, res) => {
    try {
        const b = req.body;
        let details = b.details;
        let totalAmount = b.totalAmount;

        if (!totalAmount || !Array.isArray(details)) {
            return res.status(400).send({ error: "Invalid transaction data." });
        }

        let transaction = new financialTransactions({
            totalAmount: totalAmount,
        });

        await transaction.save();
        console.log("Financial transaction saved:", transaction);

        res.status(200).send({ message: "Transaction logged successfully." });
    } catch (error) {
        console.error("Error logging transaction:", error);
        res.status(500).send({ error: "Internal server error." });
    }
});

// For getting transactions for financial report
app.get('/financial/reports', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        financialTransactions.find({
            transactionDate: { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            }
        })
        .sort({ actionDate: 1 }) // Sort by action date
        .exec()
        .then(logs => {
            console.log(logs);
            res.json(logs);
        });
    } catch (error) {
        res.status(500).send("Error fetching financial reports");
    }
});

/*********************************************************************
PRESCRIPTION ROUTES
*********************************************************************/

//Active prescriptions
app.get('/prescriptions/active', (req,res) =>{
    let p = prescriptions.find({
        status: "Active"
    }).exec();
    p.then( (results) => {
        let resultString = "<table><tr><th>Patient Name</th><th>Date Created</th><th>Medication</th><th>Quantity</th></tr>";
        for (let i in results) {
            resultString += "<tr><td id=" + results[i]._id.toString() + "-patientName>" + results[i].patientName 
            + "</td><td><input type=text id=" + results[i]._id.toString() + "-date readonly value=" + String(results[i].dateCreated)
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-medication readonly value=" + results[i].medication 
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + results[i].quantity 
            + "></td><td><button onclick=confirmFillPrescription(this) id=" + results[i]._id.toString() + "-fill>Fill Prescription</button></td></tr>";
        }
        resultString += "</table>"
        res.end(resultString);
    })
})

//Filled prescriptions ready to be picked up
app.get('/prescriptions/ready', (req,res) =>{
    let p = prescriptions.find({
        status: "Ready"
    }).exec();
    p.then( (results) => {
        let resultString = "<table><tr><th>Patient Name</th><th>Date Created</th><th>Medication</th><th>Quantity</th></tr>";
        for (let i in results) {
            resultString += "<tr><td id=" + results[i]._id.toString() + "-patientName>" + results[i].patientName 
            + "</td><td><input type=text id=" + results[i]._id.toString() + "-date readonly value=" + String(results[i].dateCreated)
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-medication readonly value=" + results[i].medication 
            + "></td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + results[i].quantity 
            + `></td><td><button onclick="addToCart('${results[i]._id}', '${results[i].medication}', '${results[i].quantity}')" id=` + results[i]._id.toString() + "-checkout>Add to Checkout</button"
            + "></td></tr>";
        }
        resultString += "</table>"
        res.end(resultString);
    })
})

// Add a prescription
app.post('/add/prescription/', (req, res) =>{
    let n = req.body.patientName;
    let d = req.body.dateCreated;
    let m = req.body.medication;
    let q = req.body.quantity;
    let i = req.body.patientID;

    console.log(i);

    var temp = new prescriptions({
        patientName: n,
        dateCreated: d,
        medication: m,
        quantity: q,
        status: "Active",
        patientID: i,
    });
    let p = temp.save();
    p.then( (doc) => {
        res.end("Success");
    });
    p.catch( (err) => {
        res.end("Error saving prescription");
    });
})

// Update a prescription
app.post('/update/prescription/', (req, res) =>{
    let p = prescriptions.findByIdAndUpdate(
        req.query.id, 
        {status: req.query.status},
        {new: true, upsert: true}
    );
    p.then( (doc) => {
        let logStr = `Pharmacist: ${currentUser.username}, Prescription: ${doc._id}, Patient: ${doc.patientName}, Medication: ${doc.medication}, Quantity: ${doc.quantity}`
        logPrescription(logStr);
        res.end("Saved");
    });
    p.catch( (err) => {
        res.end("Error: " + err);
    });
});

// Find a prescription by id
app.get('/prescriptions/byid/', (req, res) =>{
    let id = req.query.id;
    let p = prescriptions.find({
        _id: id,
    }).exec();
    p.then(results => {
        if (results.length > 0) {
            res.json(results[0]);
        }
        else {
            let resultString = "<p>Error fetching prescription</p>";
            res.end(resultString);
        }
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
})

// Get prescriptions by patient, for viewing a patient's prescriptions in patient gui
app.get('/prescriptions/bypatient/', (req, res) =>{
    let id = req.query.id;
    let p = prescriptions.find({
        patientID: id,
    }).exec();
    p.then( (results) => {
        let resultString = "<table><tr><th>Status</th><th>Date Created</th><th>Medication</th><th>Quantity</th><th></th></tr>";
        for (let i in results) {
            resultString += "<tr><td id=" + results[i]._id.toString() + "-status>" + results[i].status 
            + "</td><td id=" + results[i]._id.toString() + "-date>" + String(results[i].dateCreated)
            + "</td><td id=" + results[i]._id.toString() + "-medication>" + results[i].medication 
            + "</td><td id=" + results[i]._id.toString() + "-quantity>" + results[i].quantity 
            + "</td>";
            if (results[i].status == "Active"){
                resultString += "<td><button onclick=confirmFillPrescription(this) id=" + results[i]._id.toString() + "-fill>Fill Prescription</button></td>";
            }
            else {
                resultString += "<td></td>";
            }
            resultString += "</tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    })
});

// Search prescriptions, for viewing all prescriptions for a patient
app.get('/search/prescriptions', (req,res) => {
    let text = req.query.text;
    let p = prescriptions.find({
        patientName: { $regex: text, $options: 'i' },      //i is case insensitive
    }).sort({name: "asc"}).exec();
    p.then(results => {
        if (results.length > 0) {
            let resultString = "<table><tr><th>Patient Name</th><th>Date Created</th><th>Medication</th><th>Quantity</th></tr>";
            for (let i in results) {
                resultString += "<tr><td><input type=text id=" + results[i]._id.toString() + "-name readonly value=\"" + results[i].patientName + "\""
                + "></td><td><input type=text id=" + results[i]._id.toString() + "-date-created readonly value=" + String(results[i].dateCreated)
                + "></td><td><input type=text id=" + results[i]._id.toString() + "-medication readonly value=" + results[i].medication
                + "></td><td><input type=text id=" + results[i]._id.toString() + "-quantity readonly value=" + results[i].quantity
                + "></td>"
                if (results[i].status == "Active"){
                    resultString += "<td><button onclick=confirmFillPrescription(this) id=" + results[i]._id.toString() + "-fill>Fill Prescription</button></td></tr>";
                }
                else if (results[i].status == "Filled"){
                    resultString += "<td><button onclick=\"alert('TODO: Connect to checkout')\" id=" + results[i]._id.toString() + "-checkout>Add to Checkout</button></td></tr>";
                }
                else {
                    resultString += "<td>Completed</td></tr>"
                }
            }
            resultString += "</table>";
            res.end(resultString);
        }
        else {
            let resultString = "<p id=no-prescriptions>No prescriptions found</p>";
            res.end(resultString);
        }
    })
    .catch(err => {
        console.error('Error fetching documents:', err);
    });
});

//getting filled prescriptions for checkout process
app.get('/prescriptions', (req, res) => {
    const patientId = req.query.patientId;
    
    // Fetch prescriptions that are "filled" and belong to the specified patient
    prescriptions.find({ patientID: patientId, status: 'Ready' }).exec()
    .then(prescriptions => {
        if (prescriptions.length === 0) {
            res.status(404).json({ message: 'No filled prescriptions found' });
            return;
        }
        res.json({ message: 'Success', prescriptions });
    })
    .catch(err => {
        res.status(500).json({ message: 'Error fetching prescriptions' });
    });
});

// Update prescription log
app.post('/prescriptions/logStatusUpdate', async (req, res) => {
    const { prescriptionId, status } = req.body;

    try {
        const logEntry = new updates({
            prescriptionId,
            status,
            timestamp: new Date.now(),
            action: 'status change'
        });

        await logEntry.save();
        res.status(201).json({ message: 'Status change logged successfully' });
    } catch (error) {
        console.error('Error logging status change:', error);
        res.status(500).json({ message: 'Error logging status change' });
    }
});

// Update status of prescription when filled/picked up
app.get('/prescriptions/statusUpdateLog/:prescriptionId', async (req, res) => {
    const { prescriptionId } = req.params;

    try {
        const logs = await updates.find({ prescriptionId }).sort({ timestamp: -1 }).exec();
        res.json({ logs });
    } catch (error) {
        console.error('Error retrieving activity log:', error);
        res.status(500).json({ message: 'Error retrieving activity log' });
    }
});

/*********************************************************************
PATIENT ROUTES
*********************************************************************/
//Get all patients
app.get('/patients', (req, res) => {
    let p = patients.find({}).exec();
    p.then((results) => {
        if (results.length === 0) {
            console.log('No patients found');
            res.status(404).send('No patients found');
            return;
        }
        let resultString = "<table><tr><th>Patient Name</th><th>Date of Birth</th><th>Insurance</th></tr>";
        for (let i in results) {
            let patient = results[i];
            resultString += "<tr>"
            + "<td id=\"" + patient._id.toString() + "-name\">" + patient.name + "</td>"
            + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-DoB\" readonly value=\"" + patient.dateOfBirth + "\"></td>"
            // took this out - too much info to see - can update to view all info
            // + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-phoneNumber\" readonly value=\"" + patient.phoneNumber + "\"></td>"
            // + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-email\" readonly value=\"" + patient.email + "\"></td>"
            // + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-address\" readonly value=\"" + patient.address.street + " " + patient.address.city + " " + patient.address.state + " " + patient.address.zip + "\"></td>"
            + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-insurance\" readonly value=\"" + patient.insurance + "\"></td>"
            + "<td><button onClick=\"openSeePrescriptions(this)\" id=\"" + patient._id.toString() + "-prescriptions\">See Prescriptions</button></td>"
            + "<td><button onclick=\"updatePatient(this)\" id=\"" + patient._id.toString() + "-update\">Update</button></td>"
            + "<td><button onClick=removePatient(this) id=\"" + patient._id.toString() + "-delete\"><i class='fa fa-trash'></button></td>"
            + "</tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    }).catch((err) => {
        console.error("Error fetching patients:", err);
        res.status(500).send("Error fetching patients");
    });
});

// Add new patient
app.post('/add/patient', (req, res) => {
    let n = req.body.name;
    let d = req.body.dateOfBirth;
    let p = req.body.phoneNumber;
    let e = req.body.email;
    let s = req.body.address.street;
    let c = req.body.address.city;
    let st = req.body.address.state;
    let z = req.body.address.zip;
    let i = req.body.insurance;

    var temp = new patients({
        name: n,
        dateOfBirth: d,
        phoneNumber: p,
        email: e,
        address: {
            street: s,
            city: c,
            state: st,
            zip: z,
        },
        insurance: i
    });
    let savePatient = temp.save();
    savePatient.then((doc) => {
        res.end("Success");
    });
    savePatient.catch((err) => {
        res.end("Error saving patient");
    });
});

// Update a patient
app.post('/update/patient/', (req, res) =>{
    let p = patients.findByIdAndUpdate(
        {_id: req.body.id}, 
        {dateOfBirth: req.body.dateOfBirth, phoneNumber: req.body.phoneNumber, email: req.body.email, address: {
            street: req.body.address.street,
            city: req.body.address.city,
            state: req.body.address.state,
            zip: req.body.address.zip
        }, insurance: req.body.insurance},
        {new: true, upsert: true}
    );
    p.then( (doc) => {
        res.end("Saved");
    });
    p.catch( (err) => {
        res.end("Error");
    });
});

// Delete a patient
app.post('/remove/patient/', (req, res) => {
    let id = req.body.Id;
    let p = patients.findByIdAndDelete(id).exec();
    p.then(deletedUser => {
        if (deletedUser) {
            res.end("Success");
        } else {
            res.end("Error - no patient with that id found");
        }
    })
    .catch(err => {
        res.end("Error: " + err)
    });
});

// Find a patient (for autofilling update form)
app.get('/find/patient', (req, res) => {
    const id = req.query.id
    console.log(id);
    let p = patients.findById(id).exec();

    p.then(results => {
        console.log(results)
        res.status(200).json({ message: 'Success', patient: results });
    })
    .catch(err => {
        console.error("Error searching patients:", err);
        res.status(500).json({ message: 'Error searching patients' });
    });
});

// Used in patient search functionality
app.get('/search/patient/', (req, res) => {
    const name = req.query.name ? { name: new RegExp(req.query.name, 'i') } : {}; // Case insensitive search
    const dateOfBirth = req.query.dateOfBirth ? { dateOfBirth: req.query.dateOfBirth } : {};

    // Combine the search queries
    let query = { ...name, ...dateOfBirth };

    let p = patients.find(query).exec();

    p.then(results => {
        if (results.length === 0) {
            console.log('No patients found');
            res.status(404).json({ message: 'No patients found' });
            return;
        }

        // Return the first matching patient details
        res.json({ message: 'Success', patient: results });
    })
    .catch(err => {
        console.error("Error searching patients:", err);
        res.status(500).json({ message: 'Error searching patients' });
    });
});

// Used in prescriptions to match prescription to a patient
app.get('/match/patient/', (req, res) => {
    const name = req.query.name ? { name: req.query.name } : {}; // Case insensitive search

    // Combine the search queries
    let query = { ...name };

    let p = patients.find(query).exec();

    p.then(results => {
        if (results.length === 0) {
            console.log('No patients found');
            res.status(404).json({ message: 'False' });
            return;
        }

        // Return the first matching patient details
        res.json({ message: 'True', patient: results });
    })
    .catch(err => {
        console.error("Error searching patients:", err);
        res.status(500).json({ message: 'Error searching patients' });
    });
});

/*********************************************************************
ACCOUNT ROUTES
*********************************************************************/

// Get all accounts
app.get('/accounts', (req, res) => {
    let p = accounts.find({}).exec();
    p.then((results) => {
        let resultString = "<table><tr><th>Staff Name</th><th>Staff Type</th><th>Username</th><th>Password</th></tr>";
        for (let i in results) {
            resultString += "<tr>"
                + "<td><input type=\"text\" id=\"" + results[i]._id + "-staffName\" readonly value=\"" + results[i].staffName + "\"></td>"
                + "<td><input type=\"text\" id=\"" + results[i]._id + "-staffType\" readonly value=\"" + results[i].staffType + "\"></td>"
                + "<td><input type=\"text\" id=\"" + results[i]._id + "-username\" readonly value=\"" + results[i].username + "\"></td>"
                + "<td><input type=\"password\" id=\"" + results[i]._id + "-password\" readonly value=\"" + results[i].password + "\"></td>"
                + "<td>"
                + "<button id=\"" + results[i]._id + "-update\" onClick=\"openForm(this, 2)\">Update</button>"
                + "<button id=\"" + results[i]._id + "-delete\" onClick=\"removeAccount(this)\">Delete</button>"
                + "</td></tr>";
        }
        resultString += "</table>";
        res.end(resultString);
    }).catch(err => {
        console.error('Error fetching accounts:', err);
        res.status(500).send('Error retrieving accounts');
    });
});

// Add a new account
app.post('/accounts/addAccount', (req, res) => {
    let staffName = req.body.staffName;
    let staffType = req.body.staffType;
    let username = req.body.username;
    let password = req.body.password;  // Ideally, you should hash the password before storing

    //Ensure that each account has a unique username
    accounts.findOne({ username: req.body.username }).exec()
    .then((response) => {
        console.log(response);
        if (response) {
            return res.status(400).end("Username already exists");
        }
        else {
            let newAccount = new accounts({
                staffName: staffName,
                staffType: staffType,
                username: username,
                password: password,
                locked: false
            });

            let p = newAccount.save();
            p.then((doc) => {
                res.end("Account added successfully");
            }).catch(err => {
                console.error("Error saving account:", err);
                res.status(500).send("Error saving account");
            });
        }
    });
});

// Update an account (e.g., to update password or staffType)
app.post('/accounts/updateAccount', (req, res) => {
    let id = req.body.id; // The ID of the account to update
    let newDetails = {
        staffName: req.body.staffName,
        staffType: req.body.staffType,
        username: req.body.username,
        password: req.body.password
    };

    let p = accounts.findByIdAndUpdate(id, newDetails, {new: true, upsert: true}).exec();
    p.then((doc) => {
        res.end("Account updated successfully");
    }).catch(err => {
        console.error("Error updating account:", err);
        res.status(500).send("Error updating account");
    });
});

// Route for initial password setting on first login
app.post('/accounts/updateAccountPw', (req, res) => {
    let u = req.body.username;
    let newDetails = {
        password: req.body.password
    };

    let p = accounts.findOneAndUpdate({username: u}, newDetails, {new: true, upsert: true}).exec();
    p.then((doc) => {
        res.end("Account updated successfully");
    }).catch(err => {
        console.error("Error updating account:", err);
        res.status(500).send("Error updating account");
    });
});

// Delete an account
app.post('/accounts/removeAccount', (req, res) => {
    let id = req.body.id; // The ID of the account to delete
    let p = accounts.findByIdAndDelete(id).exec();
    p.then(deletedAccount => {
        if (deletedAccount) {
            res.end("Account deleted successfully");
        } else {
            res.status(404).send("Error: No account with that ID found");
        }
    }).catch(err => {
        console.error("Error deleting account:", err);
        res.status(500).send("Error deleting account");
    });
}); 

// Find an account
app.get('/find/account', (req, res) => {
    const id = req.query.id
    let p = accounts.findById(id).exec();

    p.then(results => {
        console.log(results)
        res.status(200).json({ message: 'Success', patient: results });
    })
    .catch(err => {
        console.error("Error searching patients:", err);
        res.status(500).json({ message: 'Error searching patients' });
    });
});

//Unlock an account
app.get('/accounts/unlockAccount', (req, res) => {
    let id = req.query.id;
    console.log("Unlocking account");

    accounts.findByIdAndUpdate(id, {locked: false}, {new: true}).exec()
    .then((result) => {
        if (result != null){
            res.end("Account unlocked successfully");
        }
        else {
            res.status(404).end("Account not found");
        }
    }).catch(err => {
        console.error("Error updating account:", err);
        res.status(500).end("Error updating account");
    });
});

//Get locked accounts 
app.get('/accounts/locked', (req, res) => {
    let p = accounts.find({locked:true}).exec();
    console.log("Getting accounts");
    p.then((results) => {
        if (results.length == 0){
            res.end("<p>No locked accounts found.</p>")
        }
        else{
            let resultString = "<table><tr><th>Staff Name</th><th>Staff Type</th><th>Username</th><th>Password</th></tr>";
            for (let i in results) {
                resultString += "<tr>"
                    + "<td><input type=\"text\" id=\"" + results[i]._id + "-staffName\" readonly value=\"" + results[i].staffName + "\"></td>"
                    + "<td><input type=\"text\" id=\"" + results[i]._id + "-staffType\" readonly value=\"" + results[i].staffType + "\"></td>"
                    + "<td><input type=\"text\" id=\"" + results[i]._id + "-username\" readonly value=\"" + results[i].username + "\"></td>"
                    + "<td><input type=\"password\" id=\"" + results[i]._id + "-password\" readonly value=\"" + results[i].password + "\"></td>"
                    + "<td>"
                    + "<button id=\"" + results[i]._id + "-recover\" onClick=\"unlockAccount(this)\">Recover Account</button>"
                    + "</td></tr>";
            }
            resultString += "</table>";
            res.end(resultString);
        }
    }).catch(err => {
        console.error('Error fetching accounts:', err);
        res.status(500).end('Error retrieving locked accounts');
    });
});


/*********************************************************************
NONPRECRIPTION ROUTES
*********************************************************************/

// Get nonprescription items
app.get('/nonprescription', (req, res) => {
    console.log('Received request to /nonprescription');
    //res.send('Patients route is working!');
    let p = nonPrescriptionItems.find({}).exec();
    p.then((results) => {
        console.log('Nonprescription items found');  // Add this log to verify results

            if (results.length === 0) {
                console.log('No nonprescription items found');
                res.status(404).send('No nonprescriptions found');
                return;
            }
            let resultString = "<table><tr><th>Item Name</th><th>Quantity</th><th>Price</th><th>Action</th></tr>";
            results.forEach(item => {
                resultString += `<tr>
                    <td><input type="text" id="${item._id}-category" readonly value="${item.category}"></td>
                    <td><input type="text" id="${item._id}-name" readonly value="${item.itemName}"></td>
                    <td><input type="number" id="${item._id}-quantity" readonly value="${item.quantity}"></td>
                    <td>$<input type="text" id="${item._id}-price" readonly value="${Number.parseFloat(item.price).toFixed(2)}"></td>
                    <td>
                       <button id="${item._id}-remove" onClick="removeNonPrescriptionItems(this)">Remove</button>
                    </td>
                </tr>`;
            });
        resultString += "</table>";
        console.log('Sending response');
        res.end(resultString);
    }).catch((err) => {
        console.error("Error fetching nonprescription items:", err);
        res.status(500).send("Error fetching nonprescription items");
    });
});

// Add a nonprescription item
app.post('/add/nonprescription', (req, res) => {
    let n = req.body.itemName;
    let q = req.body.quantity; 
    let p = req.body.price;
    let c = req.body.category;

    console.log(n);

    var temp = new nonPrescriptionItems({
        itemName: n,
        quantity: q,
        price: p,
        category: c
    });

    let saveNonPrescriptionItem = temp.save();
    saveNonPrescriptionItem.then((doc) => {
        console.log("nonprescription item save successfully:", doc);
        res.end("Success");
    });
    saveNonPrescriptionItem.catch((err) => {
        console.log("Error saving nonprescription item:", doc);
        res.end("Error saving nonprescription item");
    });
});

/*********************************************************************
SHOPPING CART ROUTES
*********************************************************************/

// Add item to shopping cart
app.post('/add-to-cart', async (req, res) => {
    const { itemType, itemId, itemName, quantity, price } = req.body;
    console.log("Received item to add to cart:", req.body); // Debugging log

    try {
        // Check if a shopping cart already exists for this patient
        let cart = await shoppingCart.findOne({});

        if (!cart) {
            // If no cart exists, create a new one
            console.log("Creating a new cart"); // Debugging log
            cart = new shoppingCart({
                prescriptionItems: [],
                nonPrescriptionItems: []
            });
        }

        // Check for duplicates
        if (itemType === 'prescription') {
            const itemExists = cart.prescriptionItems.some((item) =>
                item.id._id.equals(itemId)
            );
            if (itemExists) {
                return res.status(400).send("Item already in the cart.");
            }
        }

        // Determine item type and add it to the appropriate list
        if (itemType === 'prescription') {
            let patientID = prescriptions.findById({id: itemId}).patientID;
            if (!cart.patientID) {
                shoppingCart.findOneAndUpdate({patientID : patientID})
            }
            if (cart.patientID !== patientID) {
                throw new Error('Prescription patient ID does not match the shopping cart patient ID');
            }

            cart.prescriptionItems.push({
                id: itemId,
                name: itemName,
                quantity,
                price
            });
            
        } else if (itemType === 'nonprescription') {
            cart.nonPrescriptionItems.push({
                id: itemId,
                name: itemName,
                quantity,
                price
            });
        }

        // Save the updated cart to the database
        await cart.save();
        // console.log("Cart updated successfully:", cart); // Debugging log
        res.status(200).send("Item added to cart successfully.");
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).send("Error adding item to cart.");
    }
});



// Fetch cart items for a specific patient
app.get('/get-cart', async (req, res) => {
    try {
        const cart = await shoppingCart.findOne({}).populate('prescriptionItems.id nonPrescriptionItems.id');
        res.json(cart);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send("Error fetching cart.");
    }
});

// Remove prescription from cart
app.post('/remove/prescriptionItem', async (req, res) => {
    const { itemId } = req.body;
    console.log("Removing item with ID:", itemId);

    try {
        // Convert itemId to ObjectId if necessary
        const objectId = new mongoose.Types.ObjectId(itemId);

        // Find and update the cart document to remove the item by _id
        const updatedCart = await shoppingCart.findOneAndUpdate(
            { "prescriptionItems._id": objectId },
            { $pull: { prescriptionItems: { _id: objectId } } },
            { new: true }
        );

        if (updatedCart) {
            console.log("Successfully removed item:", objectId);
            res.status(200).send("Success");
        } else {
            console.error("Item not found with ID:", objectId);
            res.status(404).send("Prescription item not found in cart");
        }
    } catch (error) {
        console.error("Error removing prescription item:", error);
        res.status(500).send("Error removing prescription item");
    }
});

// Remove nonprescription item from shopping cart
app.post('/remove/nonPrescriptionItem/', async (req, res) => {
    const { itemId } = req.body;
    console.log("Removing item with ID:", itemId);

    try {
        // Convert itemId to ObjectId if necessary
        const objectId = new mongoose.Types.ObjectId(itemId);

        // Find and update the cart document to remove the item by _id
        const updatedCart = await shoppingCart.findOneAndUpdate(
            { "nonPrescriptionItems._id": objectId },
            { $pull: { nonPrescriptionItems: { _id: objectId } } },
            { new: true }
        );

        if (updatedCart) {
            console.log("Successfully removed item:", objectId);
            res.status(200).send("Success");
        } else {
            console.error("Item not found with ID:", objectId);
            res.status(404).send("Non-Prescription item not found in cart");
        }
    } catch (error) {
        console.error("Error removing prescription item:", error);
        res.status(500).send("Error removing prescription item");
    }
});

// Complete checkout (delete cart)
app.post('/completeCheckout/', async (req, res) => {
    try {
        // Find and remove the shopping cart document for the patient
        const deletedCart = await shoppingCart.findOneAndDelete({ });

        if (deletedCart) {
            console.log("Successfully completed checkout and removed cart");
            res.status(200).send("Checkout completed and cart removed");
        } else {
            console.error("Cart not found");
            res.status(404).send("Cart not found");
        }
    } catch (error) {
        console.error("Error completing checkout and removing cart:", error);
        res.status(500).send("Error completing checkout");
    }
});

/*********************************************************************
PHARMACY INFO
*********************************************************************/
// Get pharmacy info
app.get('/info', async (req, res) => {
    try {
        // Find the first document in the collection
        const infoData = await info.findOne({});
        if (!infoData) {
            return res.status(404).send({ message: 'No info found' });
        }
        res.status(200).send(infoData); // Send the document as a response
    } catch (error) {
        console.error('Error retrieving info:', error);
        res.status(500).send({ error: 'Error retrieving info' });
    }
});

// Update pharmacy info
app.post('/update/info', async (req, res) => {
    try {
        const updatedInfo = await info.findOneAndUpdate(
            {}, 
            req.body, 
            {
                new: true, 
                upsert: true, 
                runValidators: true 
            }
        );

        res.status(200).send("Success");
    } catch (error) {
        console.error('Error updating or creating info:', error);
        res.status(500).send("Error saving info");
    }
});

/*********************************************************************
SERVER
*********************************************************************/

//Server

if(import.meta.url.endsWith('/server.js')){
    if (process.env.TEST === "test" && process.argv[1].endsWith('server.js')){
        throw new Error("You're running on the test database");
    }
    const port = 3000;
    app.listen(port, () => {
    console.log('server has started');
    });
}

export default app;         // Export the server for testing

