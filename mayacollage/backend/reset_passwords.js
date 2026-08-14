import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  firstName: String,
  lastName: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define credentials for all admin accounts
    const accounts = [
      { email: 'admin@mayaerp.com',     newPassword: 'Admin@123',     role: 'Admin' },
      { email: 'library@mayaerp.com',   newPassword: 'Library@123',   role: 'Librarian' },
      { email: 'library@maya.edu',      newPassword: 'Library@123',   role: 'Library' },
      { email: 'lab@mayaerp.com',       newPassword: 'Lab@123',       role: 'Lab' },
      { email: 'prateek@mayaerp.com',   newPassword: 'Staff@123',     role: 'Staff' },
    ];

    for (const account of accounts) {
      const user = await User.findOne({ email: account.email });
      if (!user) {
        console.log(`⚠️  User NOT FOUND: ${account.email}`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(account.newPassword, salt);
      
      await User.updateOne({ email: account.email }, { $set: { password: hashed } });
      console.log(`✅ ${account.role.padEnd(15)} | ${account.email.padEnd(30)} | New Password: ${account.newPassword}`);
    }

    console.log('\n🎉 All passwords reset successfully!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS SUMMARY');
    console.log('='.repeat(60));
    console.log('Admin:     admin@mayaerp.com     | Admin@123');
    console.log('Librarian: library@mayaerp.com   | Library@123');
    console.log('Library:   library@maya.edu      | Library@123');
    console.log('Lab:       lab@mayaerp.com        | Lab@123');
    console.log('Staff:     prateek@mayaerp.com    | Staff@123');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetPasswords();
