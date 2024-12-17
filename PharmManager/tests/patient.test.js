import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';

import app from '../server/server.js';
import { patients } from '../server/schema.js';
import { response } from 'express';

dotenv.config({path: '../../.env'});

before(async function() {
    if (process.env.TEST != "test"){
        throw new Error("Change .env now - TEST is wrong")
    }
});

after(async function() {
    await patients.deleteMany({});
});

describe('Patient Tests', () => {
    beforeEach(async () => {
        // Before each test, remove all documents in the collection
        await patients.deleteMany({});
    });

    afterEach(async () => {
        // Nothing needed here 
    });

    it("/patients", async () => {
        const patient1 = new patients({
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient1.save();
        const patient2 = new patients({
            name: "Jane Doe",
            dateOfBirth: "1997-01-01",
            phoneNumber: "1234567890",
            email: "janedoe@email.com",
            address: {
                street: "5678 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Jane's insurance"
        });
        await patient2.save();

        const results = [patient1, patient2];

        const res = await request(app)
            .get('/patients')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Patient Name</th><th>Date of Birth</th><th>Insurance</th></tr>";
        for (let i in results) {
            let patient = results[i];
            resultString += "<tr>"
            + "<td id=\"" + patient._id.toString() + "-name\">" + patient.name + "</td>"
            + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-DoB\" readonly value=\"" + patient.dateOfBirth + "\"></td>"
            + "<td><input type=\"text\" id=\"" + patient._id.toString() + "-insurance\" readonly value=\"" + patient.insurance + "\"></td>"
            + "<td><button onClick=\"openSeePrescriptions(this)\" id=\"" + patient._id.toString() + "-prescriptions\">See Prescriptions</button></td>"
            + "<td><button onclick=\"updatePatient(this)\" id=\"" + patient._id.toString() + "-update\">Update</button></td>"
            + "<td><button onClick=removePatient(this) id=\"" + patient._id.toString() + "-delete\"><i class='fa fa-trash'></button></td>"
            + "</tr>";
        }
        resultString += "</table>";  

        expect(res.text).to.equal(resultString);
    });

    it("/add/patient", async () => {
        const data = {
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        };

        const res = await request(app)
            .post('/add/patient/')
            .send(data)
            .expect(200);

        const foundpatient = await patients.findOne({ name: 'Kari Cordes' });
        expect(foundpatient).to.not.be.null;
        expect(foundpatient.name).to.equal('Kari Cordes');
        expect(foundpatient.dateOfBirth).to.equal('2002-08-16');
        expect(foundpatient.phoneNumber).to.equal('5208675309');
        expect(foundpatient.email).to.equal("example@email.com");
        expect(foundpatient.address.street).to.equal("1234 N Lane Ave");
        expect(foundpatient.address.city).to.equal("Tucson");
        expect(foundpatient.address.state).to.equal("AZ");
        expect(foundpatient.address.zip).to.equal("85719");
        expect(foundpatient.insurance).to.equal("Kari's insurance");
    });

    it("/update/patient", async () => {
        const patient1 = new patients({
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient1.save();
        const data = {
            id: patient1._id,
            name: "Kari Cordes",
            dateOfBirth: "2002-01-01",
            phoneNumber: "1234567890",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Phoenix",
                state: "AZ",
                zip: "82304"
            },
            insurance: ""
        };

        const res = await request(app)
            .post('/update/patient/')
            .send(data)
            .expect(200);

        const foundpatient = await patients.findOne({ name: 'Kari Cordes' });
        expect(foundpatient).to.not.be.null;
        expect(foundpatient.name).to.equal('Kari Cordes');
        expect(foundpatient.dateOfBirth).to.equal('2002-01-01');
        expect(foundpatient.phoneNumber).to.equal('1234567890');
        expect(foundpatient.email).to.equal("example@email.com");
        expect(foundpatient.address.street).to.equal("1234 N Lane Ave");
        expect(foundpatient.address.city).to.equal("Phoenix");
        expect(foundpatient.address.state).to.equal("AZ");
        expect(foundpatient.address.zip).to.equal("82304");
        expect(foundpatient.insurance).to.equal("");
    });

    it("/remove/patient", async () => {
        const patient1 = new patients({
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient1.save();
        const data = {
            Id: patient1._id
        };

        const res = await request(app)
            .post('/remove/patient/')
            .send(data)
            .expect(200);

        const foundpatient = await patients.findOne({ name: 'Kari Cordes' });
        expect(foundpatient).to.be.null;

        const res2 = await request(app)
            .post('/remove/patient/')
            .send(data)
            .expect(200);

        expect(res2.text).to.equal("Error - no patient with that id found");
    });

    it("/search/patient", async () => {
        const patient1 = new patients({
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient1.save();
        const patient2 = new patients({
            name: "Karissa",
            dateOfBirth: "2002-05-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient2.save();
        const data = {
            name: "Karissa"
        };

        const res = await request(app)
            .get('/search/patient/?name=Karissa&dateOfBirth=')
            .expect(200);

        let response = JSON.parse(res.text);
        expect(response).to.not.be.null;
        expect(response.message).to.equal('Success');
        expect(response.patient[0].name).to.equal('Karissa');
        expect(response.patient[0].dateOfBirth).to.equal('2002-05-16');

        const res2 = await request(app)
            .get('/search/patient/?name=&dateOfBirth=2002-08-16')
            .expect(200);

        response = JSON.parse(res2.text);
        expect(response).to.not.be.null;
        expect(response.message).to.equal('Success');
        expect(response.patient[0].name).to.equal('Kari Cordes');
        expect(response.patient[0].dateOfBirth).to.equal('2002-08-16');

        const res3 = await request(app)
            .get('/search/patient/?name=&dateOfBirth=2001-08-16')
            .expect(404);

        response = JSON.parse(res3.text);
        expect(response).to.not.be.null;
        expect(response.message).to.equal('No patients found');
        
    });

    it("/match/patient", async () => {
        const patient1 = new patients({
            name: "Kari Cordes",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient1.save();
        const patient2 = new patients({
            name: "Karissa",
            dateOfBirth: "2002-08-16",
            phoneNumber: "5208675309",
            email: "example@email.com",
            address: {
                street: "1234 N Lane Ave",
                city: "Tucson",
                state: "AZ",
                zip: "85719"
            },
            insurance: "Kari's insurance"
        });
        await patient2.save();

        const res = await request(app)
            .get('/match/patient/?name=Karissa')
            .expect(200);

        let response = JSON.parse(res.text);
        expect(response).to.not.be.null;
        expect(response.message).to.equal('True');
        expect(response.patient[0].name).to.equal('Karissa');
        expect(response.patient[0].dateOfBirth).to.equal('2002-08-16');
    });

});
