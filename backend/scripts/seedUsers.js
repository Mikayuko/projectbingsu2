// backend/scripts/seedUsers.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// User Schema (duplicate from model for standalone script)
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  role: String,
  loyaltyPoints: Number,
  loyaltyCard: {
    stamps: Number,
    totalFreeDrinks: Number
  },
  orderHistory: [],
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function seedUsers() {
  try {
    // Connect to MongoDB Atlas
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@bingsu.com' });
    const existingUser = await User.findOne({ email: 'user@bingsu.com' });

    // Create admin account
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        fullName: 'Admin User',
        email: 'admin@bingsu.com',
        password: adminPassword,
        role: 'admin',
        loyaltyPoints: 0,
        loyaltyCard: {
          stamps: 0,
          totalFreeDrinks: 0
        },
        orderHistory: [],
        isActive: true,
        createdAt: new Date()
      });
      await admin.save();
      console.log('✅ Admin account created');
      console.log('   Email: admin@bingsu.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️ Admin account already exists');
    }

    // Create customer account
    if (!existingUser) {
      const userPassword = await bcrypt.hash('user123', 10);
      const customer = new User({
        fullName: 'Test Customer',
        email: 'user@bingsu.com',
        password: userPassword,
        role: 'customer',
        loyaltyPoints: 50,
        loyaltyCard: {
          stamps: 5,
          totalFreeDrinks: 0
        },
        orderHistory: [],
        isActive: true,
        createdAt: new Date()
      });
      await customer.save();
      console.log('✅ Customer account created');
      console.log('   Email: user@bingsu.com');
      console.log('   Password: user123');
    } else {
      console.log('ℹ️ Customer account already exists');
    }

    // Create additional test customers
    const testCustomers = [
      {
        fullName: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'alice123',
        loyaltyStamps: 8
      },
      {
        fullName: 'Bob Smith',
        email: 'bob@example.com',
        password: 'bob123',
        loyaltyStamps: 3
      },
      {
        fullName: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'charlie123',
        loyaltyStamps: 0
      }
    ];

    for (const testUser of testCustomers) {
      const existing = await User.findOne({ email: testUser.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        const newUser = new User({
          fullName: testUser.fullName,
          email: testUser.email,
          password: hashedPassword,
          role: 'customer',
          loyaltyPoints: testUser.loyaltyStamps * 10,
          loyaltyCard: {
            stamps: testUser.loyaltyStamps,
            totalFreeDrinks: 0
          },
          orderHistory: [],
          isActive: true,
          createdAt: new Date()
        });
        await newUser.save();
        console.log(`✅ Test customer created: ${testUser.email} / ${testUser.password}`);
      }
    }

    console.log('\n🎉 Demo accounts created successfully!');
    console.log('\n📝 Account Summary:');
    console.log('=====================================');
    console.log('Admin Account:');
    console.log('  Email: admin@bingsu.com');
    console.log('  Password: admin123');
    console.log('\nCustomer Accounts:');
    console.log('  Email: user@bingsu.com | Password: user123 | Stamps: 5');
    console.log('  Email: alice@example.com | Password: alice123 | Stamps: 8');
    console.log('  Email: bob@example.com | Password: bob123 | Stamps: 3');
    console.log('  Email: charlie@example.com | Password: charlie123 | Stamps: 0');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedUsers();