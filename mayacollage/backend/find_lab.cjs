const mongoose = require('mongoose');

async function findLabUser() {
  try {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const labUser = await User.findOne({ role: 'Lab' });
    
    if (labUser) {
      console.log('Lab User found:');
      console.log('Email:', labUser.email);
      console.log('Password (hashed):', labUser.password);
      console.log('Name:', labUser.firstName, labUser.lastName);
    } else {
      console.log('No Lab User found.');
      // Create one just in case
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newLabUser = new User({
        email: 'lab@mayaerp.com',
        password: hashedPassword,
        role: 'Lab',
        firstName: 'Lab',
        lastName: 'Assistant',
        status: 'Active'
      });
      await newLabUser.save();
      console.log('Created new Lab User: lab@mayaerp.com / password123');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

findLabUser();
