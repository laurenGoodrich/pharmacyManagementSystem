import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});


const connection_string = process.env.TEST === "test" ? process.env.MONGODB_TEST : process.env.MONGODB_PROD;

console.log(connection_string);

//Connect to mongoDB server
mongoose.connect(connection_string);
mongoose.connection.on('error', () =>{
  console.log("There was a problem connecting to MongoDB.");
});


var InfoSchema = new mongoose.Schema( {
  name: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  }, 
  owner: String, 
  phoneNumber: String, 
  hours: {
    monday: {
      open: String,
      close: String
    },
    tuesday: {
      open: String,
      close: String
    },
    wednesday: {
      open: String,
      close: String
    },
    thursday: {
      open: String,
      close: String
    },
    friday: {
      open: String,
      close: String
    },
    saturday: {
      open: String,
      close: String
    },
    sunday: {
      open: String,
      close: String
    }
  }
});
var info = mongoose.model('Info', InfoSchema);

//Create Medicine schema
var MedicineSchema = new mongoose.Schema( {
    name: String,
    quantity: Number, 
    expirationDate: String
});
//Add schema to the mongoose model
var medicines = mongoose.model('Medicines', MedicineSchema);

var PrescriptionSchema = new mongoose.Schema( {
  prescriptionNumber: Number,
  patientName: String,
  dateCreated: String, 
  datePickedUp: String,
  medication: String,
  quantity: Number,
  status: String,
  patientID: String,
})
var prescriptions = mongoose.model('Prescriptions', PrescriptionSchema);


var AccountSchema = new mongoose.Schema( {
  staffName: String,
  staffType: String,
  username: String, 
  password: String,
  locked: Boolean
})
var accounts = mongoose.model('Accounts', AccountSchema);

var PatientSchema = new mongoose.Schema( {
  name: String,
  dateOfBirth: String,
  phoneNumber: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  insurance: String         //Treat no insurance as "" yes insurance as anything else
});
var patients = mongoose.model('Patients', PatientSchema);

//inventoryLog schema
var InventoryLogSchema = new mongoose.Schema({
  medicineName: String,
  quantity: Number,
  expirationDate: String,
  action: String, // Can be "added", "updated", or "removed"
  actionDate: { type: Date, default: Date.now } // Automatically stores the action's date and time
});
var inventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);

var FinancialTransactionSchema = new mongoose.Schema({
  transactionDate: { type: Date, default: Date.now }, 
  totalAmount: Number,
});
var financialTransactions = mongoose.model('FinancialTransaction', FinancialTransactionSchema);

var NonPrescriptionItemSchema = new mongoose.Schema ({
  category: String,
  itemName: String,
  quantity: Number,
  price: Number
});
var nonPrescriptionItems = mongoose.model('NonPrescriptionItems', NonPrescriptionItemSchema);

var shoppingCartSchema = new mongoose.Schema({
  patientID: {type: mongoose.Schema.Types.ObjectId, ref: 'Patients'},
  prescriptionItems: [
      {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescriptions' },
          name: String,
          quantity: Number,
          price: Number
      }
  ],
  nonPrescriptionItems: [
      {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'NonPrescriptionItems' },
          name: String,
          quantity: Number,
          price: Number
      }
  ]
});
var shoppingCart = mongoose.model('ShoppingCart', shoppingCartSchema);

//activity log/status updates table in database
var updatesLogSchema = new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescriptions', required: true }, 
  status: { type: String, enum: ['Active', 'Ready'], required: true },
  timestamp: { type: mongoose.Schema.Types.Date, ref: 'Timestamp', required: true },
  action: String
});
var updates = mongoose.model('Updates', updatesLogSchema);


export {medicines, prescriptions, patients, accounts, inventoryLog, shoppingCart, updates, nonPrescriptionItems, info, financialTransactions}
