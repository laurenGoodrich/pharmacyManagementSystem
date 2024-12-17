import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';

import app from '../server/server.js';
import { prescriptions } from '../server/schema.js';

dotenv.config({path: '../../.env'});

before(async function() {
    if (process.env.TEST != "test"){
        throw new Error("Change .env now - TEST is wrong")
    }
});

after(async function() {
    await prescriptions.deleteMany({});
});

describe('Prescription Tests', () => {
    beforeEach(async () => {
        // Before each test, remove all documents in the collection
        await prescriptions.deleteMany({});
    });

    afterEach(async () => {
        // Nothing needed here 
    });

    it('/prescriptions/active', async () => {
        const newPresc1 = new prescriptions({
            patientName: "Test Patient 1",
            dateCreated: "2024-10-30",
            medication: "Med 1",
            quantity: 7,
            status: "Active",
            patientID: "1"
        });
        await newPresc1.save();
        const newPresc2 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-10-30",
            medication: "Med 2",
            quantity: 14,
            status: "Ready",
            patientID: "2"
        });
        await newPresc2.save();
        const newPresc3 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-10-30",
            medication: "Med 14",
            quantity: 14,
            status: "Active",
            patientID: "2"
        });
        await newPresc3.save();

        const prescs = [newPresc1, newPresc3];

        const res = await request(app)
            .get('/prescriptions/active')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Patient Name</th><th>Date Created</th><th>Medication</th><th>Quantity</th></tr>";
        for (let i in prescs) {
            resultString += "<tr><td id=" + prescs[i]._id.toString() + "-patientName>" + prescs[i].patientName 
            + "</td><td><input type=text id=" + prescs[i]._id.toString() + "-date readonly value=" + String(prescs[i].dateCreated)
            + "></td><td><input type=text id=" + prescs[i]._id.toString() + "-medication readonly value=" + prescs[i].medication 
            + "></td><td><input type=text id=" + prescs[i]._id.toString() + "-quantity readonly value=" + prescs[i].quantity 
            + "></td><td><button onclick=confirmFillPrescription(this) id=" + prescs[i]._id.toString() + "-fill>Fill Prescription</button></td></tr>";
        }
        resultString += "</table>"

        expect(res.text).to.equal(resultString);
    });

    it('/prescriptions/ready', async () => {
        const newPresc1 = new prescriptions({
            patientName: "Test Patient 1",
            dateCreated: "2024-10-30",
            medication: "Med 1",
            quantity: 7,
            status: "Ready",
            patientID: "1"
        });
        await newPresc1.save();
        const newPresc2 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-10-30",
            medication: "Med 2",
            quantity: 14,
            status: "Ready",
            patientID: "2"
        });
        await newPresc2.save();
        const newPresc3 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-10-30",
            medication: "Med 14",
            quantity: 14,
            status: "Active",
            patientID: "2"
        });
        await newPresc3.save();

        const prescs = [newPresc1, newPresc2];

        const res = await request(app)
            .get('/prescriptions/ready')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Patient Name</th><th>Date Created</th><th>Medication</th><th>Quantity</th></tr>";
        for (let i in prescs) {
            resultString += "<tr><td id=" + prescs[i]._id.toString() + "-patientName>" + prescs[i].patientName 
            + "</td><td><input type=text id=" + prescs[i]._id.toString() + "-date readonly value=" + String(prescs[i].dateCreated)
            + "></td><td><input type=text id=" + prescs[i]._id.toString() + "-medication readonly value=" + prescs[i].medication 
            + "></td><td><input type=text id=" + prescs[i]._id.toString() + "-quantity readonly value=" + prescs[i].quantity 
            + `></td><td><button onclick="addToCart('${prescs[i]._id}', '${prescs[i].medication}', '${prescs[i].quantity}')" id=` + prescs[i]._id.toString() + "-checkout>Add to Checkout</button"
            + "></td></tr>";
        }
        resultString += "</table>"

        expect(res.text).to.equal(resultString);
    });

    it('/add/prescription', async () => {
        const data = {
            patientName: "Test Patient 2",
            dateCreated: "2024-11-18",
            medication: "Med 1",
            quantity: 14,
            patientID: "2"
        };

        const res = await request(app)
            .post('/add/prescription/')
            .send(data)
            .expect(200);

        const foundpresc = await prescriptions.findOne({ patientName: 'Test Patient 2' });
        expect(foundpresc).to.not.be.null;
        expect(foundpresc.patientName).to.equal('Test Patient 2');
        expect(foundpresc.medication).to.equal('Med 1');
        expect(foundpresc.dateCreated).to.equal('2024-11-18');
        expect(foundpresc.quantity).to.equal(14);
        expect(foundpresc.status).to.equal("Active");
        expect(foundpresc.patientID).to.equal("2");
    });

    it('/update/prescription/', async() => {
        const newPresc = new prescriptions({
            patientName: "Test Patient 1",
            dateCreated: "2024-10-30",
            medication: "Med 1",
            quantity: 7,
            status: "Active",
            patientID: "1b"
        });
        await newPresc.save();

        const res = await request(app)
            .post('/update/prescription/?id='+newPresc._id+"&status="+"Ready")
            .expect(200);
        
        console.log(res.text);

        const foundpresc = await prescriptions.findOne({ patientName: 'Test Patient 1' });
        expect(foundpresc).to.not.be.null;
        expect(foundpresc.patientName).to.equal('Test Patient 1');
        expect(foundpresc.medication).to.equal('Med 1');
        expect(foundpresc.dateCreated).to.equal('2024-10-30');
        expect(foundpresc.quantity).to.equal(7);
        expect(foundpresc.status).to.equal("Ready");
        expect(foundpresc.patientID).to.equal("1b");
    });

    it('/prescriptions/byid', async () => {
        const newPresc = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-11-18",
            medication: "Med 1",
            quantity: 14,
            status: "Active",
            patientID: "1b"
        });
        await newPresc.save();

        const res = await request(app)
            .get('/prescriptions/byid?id=' + newPresc._id)
            .expect(200);

        const response = JSON.parse(res.text);
        expect(response.patientName).to.equal('Test Patient 2');
        expect(response.medication).to.equal('Med 1');
        expect(response.dateCreated).to.equal('2024-11-18');
        expect(response.quantity).to.equal(14);
        expect(response.status).to.equal("Active");
        expect(response.patientID).to.equal("1b");
    });

    it('/prescriptions/bypatient', async () => {
        const newPresc1 = new prescriptions({
            patientName: "Test Patient 1",
            dateCreated: "2024-10-30",
            medication: "Med 1",
            quantity: 7,
            status: "Ready",
            patientID: "1b"
        });
        await newPresc1.save();
        const newPresc2 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-10-30",
            medication: "Med 2",
            quantity: 14,
            status: "Ready",
            patientID: "2a"
        });
        await newPresc2.save();
        const newPresc3 = new prescriptions({
            patientName: "Test Patient 2",
            dateCreated: "2024-11-18",
            medication: "Med 1",
            quantity: 14,
            status: "Active",
            patientID: "2a"
        });
        await newPresc3.save();

        const prescs = [newPresc2, newPresc3];

        const res = await request(app)
            .get('/prescriptions/bypatient/' + "?id=2a")
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Status</th><th>Date Created</th><th>Medication</th><th>Quantity</th><th></th></tr>";
        for (let i in prescs) {
            resultString += "<tr><td id=" + prescs[i]._id.toString() + "-status>" + prescs[i].status 
            + "</td><td id=" + prescs[i]._id.toString() + "-date>" + String(prescs[i].dateCreated)
            + "</td><td id=" + prescs[i]._id.toString() + "-medication>" + prescs[i].medication 
            + "</td><td id=" + prescs[i]._id.toString() + "-quantity>" + prescs[i].quantity 
            + "</td>";
            if (prescs[i].status == "Active"){
                resultString += "<td><button onclick=confirmFillPrescription(this) id=" + prescs[i]._id.toString() + "-fill>Fill Prescription</button></td>";
            }
            else {
                resultString += "<td></td>";
            }
            resultString += "</tr>";
        }
        resultString += "</table>"

        expect(res.text).to.equal(resultString);
    });

});