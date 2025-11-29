// scripts/fix_passwords.js - Fix double-hashed passwords in database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-ocr');
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  company: String,
  isActive: Boolean,
  lastLogin: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const fixPasswords = async () => {
  console.log('\n========================================');
  console.log('  Password Fix Script');
  console.log('========================================\n');

  console.log('⚠️  WARNING: This will delete all existing users!');
  console.log('   Existing users have double-hashed passwords that cannot be fixed.');
  console.log('   They need to be deleted and recreated.\n');

  try {
    await connectDB();

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} user(s) in database\n`);

    if (users.length === 0) {
      console.log('✓ No users to fix. Database is clean.');
      process.exit(0);
    }

    // List users
    console.log('Current users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.name})`);
    });
    console.log('');

    // Delete all users
    const result = await User.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} user(s)`);
    console.log('');
    console.log('✓ Database cleaned successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Update auth_controller.js with the fixed version');
    console.log('  2. Restart your backend server');
    console.log('  3. Register users again (passwords will be hashed correctly)');
    console.log('  4. Or run: ./create_test_user.sh');
    console.log('');

  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed\n');
    process.exit(0);
  }
};

// Run the script
fixPasswords();