const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetLibPassword() {
  try {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const hp = await bcrypt.hash('password123', 10);
    await User.updateOne({ email: 'library@mayaerp.com' }, { $set: { password: hp } });
    console.log('Password reset to password123');
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

resetLibPassword();
