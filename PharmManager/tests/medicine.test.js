import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';

import app from '../server/server.js';
import { medicines } from '../server/schema.js';

dotenv.config({path: '../../.env'});

before(async function() {
    if (process.env.TEST != "test"){
        throw new Error("Change .env now - TEST is wrong")
    }
});

after(async function() {
    await medicines.deleteMany({});
});

describe('Medicine Tests', () => {
    beforeEach(async () => {
        // Before each test, remove all documents in the collection
        await medicines.deleteMany({});
    });

    afterEach(async () => {
        // Nothing needed here 
    });

    it('/medicines', async () => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 100,
            expirationDate: '2024-12-31'
        });
        // Save the medicine document to the database
        await newMedicine.save();
        const newMedicine2 = new medicines({
            name: 'Test Medicine2',
            quantity: 200,
            expirationDate: '2025-1-31'
        });
        await newMedicine2.save();
        //This array HAS TO contain them in alphabetical order by name or it won't work
        const meds = [newMedicine, newMedicine2];

        const res = await request(app)
            .get('/medicines/')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        for (let i in meds) {
            resultString += "<tr><td id=" + meds[i]._id.toString() + "-name>" + meds[i].name + "</td><td><input type=text id=" + meds[i]._id.toString() + "-quantity readonly value=" + String(meds[i].quantity)
            + "></td><td><input type=text id=" + meds[i]._id.toString() + "-expiration readonly value=" + meds[i].expirationDate + "></td><td><button type=button id=" + meds[i]._id.toString() + "-update onClick=toggleUpdateMedicine(this)>Update</button></td><td>" +
            "<button onClick=removeMedicine(this) id=" + meds[i]._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + meds[i]._id.toString() + "-orderMore>Order More</button></td></tr>";
        }
        resultString += "</table>";  

        expect(res.text).to.equal(resultString);
    });

    it('/medicines/expiring', async() => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 100,
            expirationDate: '2024-10-31'
        });
        // Save the medicine document to the database
        await newMedicine.save();
        const newMedicine2 = new medicines({
            name: 'Test Medicine2',
            quantity: 200,
            expirationDate: '2025-1-31'
        });
        await newMedicine2.save();

        const res = await request(app)
            .get('/medicines/expiring')
            .expect(200);

        expect(res.text).to.not.be.null;

        const today = new Date();
        const expirationDate = new Date(newMedicine.expirationDate);
        const isExpired = expirationDate < today;

        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        const rowStyle = isExpired ? "style='background-color: lightcoral;'" : "";
        resultString += "<tr " + rowStyle + "><td id=" + newMedicine._id.toString() + "-name>" + newMedicine.name + "</td><td><input type=text id=" + newMedicine._id.toString() + "-quantity readonly value=" + String(newMedicine.quantity)
        + "></td><td><input type=text id=" + newMedicine._id.toString() + "-expiration readonly value=" + newMedicine.expirationDate + "></td>" +
        "<td><button onClick=removeMedicine(this) id=" + newMedicine._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + newMedicine._id.toString() + "-orderMore>Order More</button></td></tr>";
        resultString += "</table>"; 

        expect(res.text).to.equal(resultString);
    });

    it('/medicines/lowinventory', async() => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 200,
            expirationDate: '2024-10-31'
        });
        // Save the medicine document to the database
        await newMedicine.save();
        const newMedicine2 = new medicines({
            name: 'Test Medicine2',
            quantity: 100,
            expirationDate: '2025-1-31'
        });
        await newMedicine2.save();

        const res = await request(app)
            .get('/medicines/lowinventory')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        resultString += "<tr><td id=" + newMedicine2._id.toString() + "-name>" + newMedicine2.name + "</td><td><input type=text id=" + newMedicine2._id.toString() + "-quantity readonly value=" + String(newMedicine2.quantity)
        + "></td><td><input type=text id=" + newMedicine2._id.toString() + "-expiration readonly value=" + newMedicine2.expirationDate + "></td>" +
        "<td><button onClick=removeMedicine(this) id=" + newMedicine2._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + newMedicine2._id.toString() + "-orderMore>Order More</button></td></tr>";
        resultString += "</table>";  

        expect(res.text).to.equal(resultString);
    });

    it('/update/medicine/', async() => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 200,
            expirationDate: '2024-10-31'
        });
        await newMedicine.save();

        const data = { id: newMedicine._id, name: newMedicine.name, quantity: 400, expirationDate: "2024-12-31" };
        const res = await request(app)
            .post('/update/medicine/')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(200);
        
        expect(res.text).to.equal("Saved");

        const updatedMedicine = await medicines.findOne({ name: 'Test Medicine' });
        expect(updatedMedicine._id.toString()).to.equal(newMedicine._id.toString());
        expect(updatedMedicine.quantity).to.equal(400);
        expect(updatedMedicine.expirationDate).to.equal("2024-12-31");
    })

    it('/add/medicine', async () => {
        const data = { name: 'Test medicine', quantity: 500, expirationDate:'2024-11-18' };

        const res = await request(app)
            .post('/add/medicine/')
            .send(data)
            .expect(200);

        const foundmedicine = await medicines.findOne({ name: 'Test medicine' });
        expect(foundmedicine).to.not.be.null;
        expect(foundmedicine.name).to.equal('Test medicine');
        expect(foundmedicine.quantity).to.equal(500);
        expect(foundmedicine.expirationDate).to.equal('2024-11-18');
    });

    it('/remove/medicine', async() => {
        const medicine = new medicines({ name: 'Test medicine', quantity: 500, expirationDate:'2024-11-18' });
        await medicine.save();

        const res = await request(app)
            .post('/remove/medicine/')
            .send({Id:medicine._id})
            .expect(200);

        expect(res.text).to.equal("Success");
        const found = await medicines.findById(medicine._id);
        expect(found).to.equal(null);
    });

    it('/find/medicine/', async () => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 100,
            expirationDate: '2024-10-31'
        });
        // Save the medicine document to the database
        await newMedicine.save();
        const newMedicine2 = new medicines({
            name: 'Test Medicine2',
            quantity: 200,
            expirationDate: '2025-1-31'
        });
        await newMedicine2.save();

        const res = await request(app)
            .get('/find/medicine?name='+newMedicine2.name+'&quantity=14')
            .expect(200);

        const response = JSON.parse(res.text);
        //Returns json of medicine object - used with prescriptions somewhere
        expect(response.name).to.equal(newMedicine2.name);

        const res2 = await request(app)
            .get('/find/medicine?name='+newMedicine.name+'&quantity=14')
            .expect(200);

        //Returns json of medicine object - used with prescriptions somewhere
        expect(res2.text).to.equal("<p>Medication unavailable</p>");
    }); 

    it('/search/medicine', async () => {
        const newMedicine = new medicines({
            name: 'Test Medicine',
            quantity: 100,
            expirationDate: '2024-10-31'
        });
        // Save the medicine document to the database
        await newMedicine.save();
        const newMedicine2 = new medicines({
            name: 'Medicine2',
            quantity: 200,
            expirationDate: '2025-1-31'
        });
        await newMedicine2.save();

        const res = await request(app)
            .get('/search/medicine?name=Test')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Name</th><th>Quantity</th><th>Expiration Date</th></tr>";
        resultString += "<tr><td id=" + newMedicine._id.toString() + "-name>" + newMedicine.name + "</td><td><input type=text id=" + newMedicine._id.toString() + "-quantity readonly value=" + String(newMedicine.quantity)
        + "></td><td><input type=text id=" + newMedicine._id.toString() + "-expiration readonly value=" + newMedicine.expirationDate + "></td><td><button type=button id=" + newMedicine._id.toString() + "-update onClick=toggleUpdateMedicine(this)>Update</button></td><td>" +
        "<button onClick=removeMedicine(this) id=" + newMedicine._id.toString() + "-delete><i class='fa fa-trash'></button></td><td><button onClick=orderMore(this) id=" + newMedicine._id.toString() + "-orderMore>Order More</button></td></tr>";
        resultString += "</table>";  

        expect(res.text).to.equal(resultString);
    });
});
