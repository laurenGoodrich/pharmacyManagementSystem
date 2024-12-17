import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';

import app from '../server/server.js';
import { accounts } from '../server/schema.js';

dotenv.config({path: '../../.env'});

before(async function() {
    if (process.env.TEST != "test"){
        throw new Error("Change .env now - TEST is wrong")
    }
});

after(async function() {
    await accounts.deleteMany({});
});

describe('Account Tests', () => {
    beforeEach(async () => {
        // Before each test, remove all documents in the collection
        await accounts.deleteMany({});
    });

    afterEach(async () => {
        // Nothing needed here 
    });

    it('/accounts', async () => {
        const account1 = new accounts({
            staffName: "Kari Cordes",
            staffType: "pharmacyManager",
            username: "karicordes", 
            password: "password",
        });
        await account1.save();
        const account2 = new accounts({
            staffName: "Malia Edmonds",
            staffType: "pharmacist",
            username: "maliaedmonds", 
            password: "password",
        });
        await account2.save();

        const accts = [account1, account2];

        const res = await request(app)
            .get('/accounts/')
            .expect(200);

        expect(res.text).to.not.be.null;

        let resultString = "<table><tr><th>Staff Name</th><th>Staff Type</th><th>Username</th><th>Password</th></tr>";
        for (let i in accts) {
            resultString +="<tr>"
                + "<td><input type=\"text\" id=\"" + accts[i]._id + "-staffName\" readonly value=\"" + accts[i].staffName + "\"></td>"
                + "<td><input type=\"text\" id=\"" + accts[i]._id + "-staffType\" readonly value=\"" + accts[i].staffType + "\"></td>"
                + "<td><input type=\"text\" id=\"" + accts[i]._id + "-username\" readonly value=\"" + accts[i].username + "\"></td>"
                + "<td><input type=\"password\" id=\"" + accts[i]._id + "-password\" readonly value=\"" + accts[i].password + "\"></td>"
                + "<td>"
                + "<button id=\"" + accts[i]._id + "-update\" onClick=\"openForm(this, 2)\">Update</button>"
                + "<button id=\"" + accts[i]._id + "-delete\" onClick=\"removeAccount(this)\">Delete</button>"
                + "</td></tr>";
        }
        resultString += "</table>";  

        expect(res.text).to.equal(resultString);
    });

    it('/accounts/addAccount', async () => {
        const data = {
            staffName: "Kari Cordes",
            staffType: "pharmacyManager",
            username: "karicordes", 
            password: "password",
        };

        const res = await request(app)
            .post('/accounts/addAccount/')
            .send(data)
            .expect(200);

        const acct = await accounts.findOne({ username: 'karicordes' });
        expect(acct).to.not.be.null;
        expect(acct.staffName).to.equal('Kari Cordes');
        expect(acct.staffType).to.equal("pharmacyManager");
        expect(acct.username).to.equal('karicordes');
        expect(acct.password).to.equal('password');
    });

    it('/accounts/updateAccount', async() => {
        const account1 = new accounts({
            staffName: "Kari Cordes",
            staffType: "pharmacyManager",
            username: "karicordes", 
            password: "password",
        });
        await account1.save();

        const data = {
            id: account1._id,
            staffName: "CHANGED",
            staffType: "pharmacist",
            password: "1234",
        };

        const res = await request(app)
            .post('/accounts/updateAccount/')
            .send(data)
            .expect(200);

        const acct = await accounts.findOne({ username: 'karicordes' });
        expect(acct).to.not.be.null;
        expect(acct.staffName).to.equal('CHANGED');
        expect(acct.staffType).to.equal("pharmacist");
        expect(acct.password).to.equal('1234');
    });

    it('/accounts/removeAccount', async() => {
        const account1 = new accounts({
            staffName: "Kari Cordes",
            staffType: "pharmacyManager",
            username: "karicordes", 
            password: "password",
        });
        await account1.save();

        const res = await request(app)
            .post('/accounts/removeAccount/')
            .send({id:account1._id})
            .expect(200);

        expect(res.text).to.equal("Account deleted successfully");
        const found = await accounts.findById(account1._id);
        expect(found).to.equal(null);
    });
});
