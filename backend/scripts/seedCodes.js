// backend/scripts/seedCodes.js - Simple and Direct

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedMenuCodes() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🌱 BINGSU MENU CODE SEEDER');
    console.log('='.repeat(60) + '\n');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Define MenuCode schema directly
    const menuCodeSchema = new mongoose.Schema({
      code: { type: String, unique: true, required: true, uppercase: true },
      cupSize: { type: String, enum: ['S', 'M', 'L'], required: true },
      isUsed: { type: Boolean, default: false },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      usedBy: {
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        usedAt: Date
      },
      expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      createdAt: { type: Date, default: Date.now }
    });

    const MenuCode = mongoose.model('MenuCode', menuCodeSchema);

    // Create dummy admin ID
    const dummyAdminId = new mongoose.Types.ObjectId();

    // Test codes
    const testCodes = [
      { code: 'TEST1', cupSize: 'S' },
      { code: 'TEST2', cupSize: 'M' },
      { code: 'TEST3', cupSize: 'L' },
      { code: 'DEMO1', cupSize: 'S' },
      { code: 'DEMO2', cupSize: 'M' },
      { code: 'DEMO3', cupSize: 'L' },
      { code: 'ABC12', cupSize: 'M' },
      { code: 'XYZ99', cupSize: 'L' },
      { code: 'BING1', cupSize: 'S' },
      { code: 'BING2', cupSize: 'M' },
    ];

    console.log('📝 Processing menu codes...\n');

    let created = 0;
    let reset = 0;
    let skipped = 0;

    for (const testCode of testCodes) {
      try {
        const existing = await MenuCode.findOne({ code: testCode.code });

        if (!existing) {
          // Create new code
          await MenuCode.create({
            code: testCode.code,
            cupSize: testCode.cupSize,
            isUsed: false,
            createdBy: dummyAdminId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
          console.log(`✅ Created: ${testCode.code.padEnd(6)} | Size: ${testCode.cupSize}`);
          created++;
        } else if (existing.isUsed) {
          // Reset used code
          existing.isUsed = false;
          existing.usedBy = undefined;
          existing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await existing.save();
          console.log(`🔄 Reset:   ${testCode.code.padEnd(6)} | Size: ${testCode.cupSize}`);
          reset++;
        } else {
          console.log(`ℹ️  Exists:  ${testCode.code.padEnd(6)} | Size: ${testCode.cupSize}`);
          skipped++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${testCode.code}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Reset:   ${reset}`);
    console.log(`ℹ️  Skipped: ${skipped}`);
    console.log('='.repeat(60) + '\n');

    // Show all valid codes
    console.log('📋 AVAILABLE CODES (Valid & Unused)');
    console.log('='.repeat(60));
    
    const validCodes = await MenuCode.find({ 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort('code');

    if (validCodes.length === 0) {
      console.log('⚠️  No valid codes found!');
    } else {
      for (const code of validCodes) {
        const expiry = new Date(code.expiresAt).toLocaleDateString('en-US');
        console.log(`  ${code.code} | Size: ${code.cupSize} | Expires: ${expiry}`);
      }
    }
    
    console.log('='.repeat(60) + '\n');
    console.log('💡 TIP: Use these codes in your app to test ordering!');
    console.log('💡 Go to http://localhost:3000/home and enter a code.\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed.\n');
    process.exit(0);
  }
}

// Run
seedMenuCodes();