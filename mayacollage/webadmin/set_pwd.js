const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/').then(async () => {
    const db = mongoose.connection.db;
    await db.collection('users').updateOne({ email: 'staff@mayaerp.com' }, { $set: { password: 'Password@123' } });
    const user = await db.collection('users').findOne({email: 'staff@mayaerp.com'});
    console.log('Password is:', user.password);
    process.exit(0);
});
