// migration.js
const mongoose = require('mongoose');
require('dotenv').config();

const Invoice = require('./src/models/Invoice');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Update existing invoices with default values for new fields
  await Invoice.updateMany(
    { retryCount: { $exists: false } },
    { 
      $set: { 
        retryCount: 0,
        confidence: { overall: 0.5, breakdown: {} }
      }
    }
  );
  
  console.log('Migration completed');
  process.exit(0);
}

migrate();