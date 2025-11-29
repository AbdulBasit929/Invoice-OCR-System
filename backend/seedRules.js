const mongoose = require('mongoose');
const ValidationRule = require('./src/models/ValidationRule');

async function seedValidationRules() {
  await mongoose.connect('mongodb://localhost:27017/invoice-ocr', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const rules = [
    {
      fieldName: 'invoiceNumber',
      fieldType: 'critical',
      rules: {
        required: true,
        pattern: '^[A-Z0-9-]+$',
      },
      errorMessages: {
        required: 'Invoice number is required',
        invalid: 'Invoice number must be alphanumeric with hyphens',
      },
      isActive: true,
    },
    {
      fieldName: 'totalAmount',
      fieldType: 'critical',
      rules: {
        required: true,
        minValue: 0,
        maxValue: 1000000,
      },
      errorMessages: {
        required: 'Total amount is required',
        outOfRange: 'Total amount must be between 0 and 1,000,000',
      },
      isActive: true,
    },
    {
      fieldName: 'invoiceDate',
      fieldType: 'important',
      rules: {
        required: true,
      },
      errorMessages: {
        required: 'Invoice date is required',
      },
      isActive: true,
    },
    {
      fieldName: 'email',
      fieldType: 'optional',
      rules: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      errorMessages: {
        invalid: 'Email format is invalid',
      },
      isActive: true,
    },
  ];

  await ValidationRule.deleteMany({});
  await ValidationRule.insertMany(rules);
  console.log('Validation rules seeded');
  mongoose.connection.close();
}

seedValidationRules().catch(console.error);