import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function main() {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    
    const user = await User.findOne({ email: 'lalit@mayaerp.com' });
    if (user) {
        user.firstName = 'Lalit';
        user.lastName = 'Cyberlim';
        await user.save();
        console.log("Successfully reverted user's name back to Lalit Cyberlim!");
    } else {
        console.log("Could not find lalit@mayaerp.com in the database.");
    }
    process.exit(0);
}

main().catch(console.error);
