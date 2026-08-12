const mongoose = require('mongoose');

async function findLibUser() {
  try {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const libUser = await User.findOne({ role: { $in: ['Librarian', 'Library'] } });
    
    if (libUser) {
      console.log('Library User found:');
      console.log('Email:', libUser.email);
      console.log('Password (hashed):', libUser.password);
      console.log('Name:', libUser.firstName, libUser.lastName);
    } else {
      console.log('No Library User found.');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newLibUser = new User({
        email: 'library@mayaerp.com',
        password: hashedPassword,
        role: 'Librarian',
        firstName: 'Head',
        lastName: 'Librarian',
        status: 'Active'
      });
      await newLibUser.save();
      console.log('Created new Library User: library@mayaerp.com / password123');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

findLibUser();
