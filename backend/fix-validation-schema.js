// fix-validation-schema.js - Fix the validation.warnings field type
// Usage: node fix-validation-schema.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fixValidationSchema() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-ocr');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('invoices');

    // Count documents with string warnings
    const docsWithStringWarnings = await collection.countDocuments({
      'validation.warnings': { $type: 'string' }
    });

    console.log(`📊 Found ${docsWithStringWarnings} documents with string warnings\n`);

    if (docsWithStringWarnings === 0) {
      console.log('✅ No documents need fixing!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Fix all documents with string warnings
    console.log('🔧 Converting string warnings to arrays...\n');

    const result = await collection.updateMany(
      {
        'validation.warnings': { $type: 'string' }
      },
      [
        {
          $set: {
            'validation.warnings': {
              $cond: {
                if: { $eq: [{ $type: '$validation.warnings' }, 'string'] },
                then: ['$validation.warnings'],
                else: '$validation.warnings'
              }
            }
          }
        }
      ]
    );

    console.log(`✅ Fixed ${result.modifiedCount} documents\n`);

    // Also fix errors field if it exists
    const docsWithStringErrors = await collection.countDocuments({
      'validation.errors': { $type: 'string' }
    });

    if (docsWithStringErrors > 0) {
      console.log(`📊 Found ${docsWithStringErrors} documents with string errors\n`);
      console.log('🔧 Converting string errors to arrays...\n');

      const errorResult = await collection.updateMany(
        {
          'validation.errors': { $type: 'string' }
        },
        [
          {
            $set: {
              'validation.errors': {
                $cond: {
                  if: { $eq: [{ $type: '$validation.errors' }, 'string'] },
                  then: ['$validation.errors'],
                  else: '$validation.errors'
                }
              }
            }
          }
        ]
      );

      console.log(`✅ Fixed ${errorResult.modifiedCount} documents\n`);
    }

    // Verify the fix
    console.log('🔍 Verifying fix...\n');
    const remainingBadDocs = await collection.countDocuments({
      $or: [
        { 'validation.warnings': { $type: 'string' } },
        { 'validation.errors': { $type: 'string' } }
      ]
    });

    if (remainingBadDocs === 0) {
      console.log('✅ All documents fixed successfully!\n');
    } else {
      console.log(`⚠️  ${remainingBadDocs} documents still need fixing\n`);
    }

    // Show sample fixed document
    const sample = await collection.findOne({
      'validation.warnings': { $exists: true }
    });

    if (sample) {
      console.log('📄 Sample fixed document:\n');
      console.log('validation.warnings:', sample.validation?.warnings);
      console.log('Type:', Array.isArray(sample.validation?.warnings) ? 'Array ✅' : 'Not Array ❌');
    }

    console.log('\n✅ Schema fix complete!');
    console.log('ℹ️  You can now retry the upload.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing schema:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the fix
console.log('='.repeat(70));
console.log('MongoDB Validation Schema Fix');
console.log('='.repeat(70));
console.log('');

fixValidationSchema();