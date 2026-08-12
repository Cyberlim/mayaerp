const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/').then(async () => {
    const db = mongoose.connection.db;
    
    // We can just insert plain text 'Password@123' because our updated API
    // securely handles plain text passwords and hashes them on first login!
    const plainPassword = 'Password@123';

    await db.collection('users').updateOne(
        { email: 'staff@mayaerp.com' },
        { $set: { email: 'staff@mayaerp.com', firstName: 'Senior', lastName: 'Teacher', password: plainPassword, role: 'Staff', department: 'Academic', status: 'Active' } },
        { upsert: true }
    );
    await db.collection('users').updateOne(
        { email: 'admin@mayaerp.com' },
        { $set: { email: 'admin@mayaerp.com', firstName: 'Super', lastName: 'Admin', password: plainPassword, role: 'Admin', department: 'Academic', status: 'Active' } },
        { upsert: true }
    );
    console.log('Upserted users with plain text password!');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
