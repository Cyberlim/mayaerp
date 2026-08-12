import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
    targetType: String,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    schedule: [{
        day: String,
        slots: [{
            subject: String,
            facultyUserId: mongoose.Schema.Types.ObjectId,
            facultyName: String,
        }]
    }]
});

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ firstName: String, lastName: String }));

async function main() {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    
    // Find prateek kumar user id
    const prateek = await User.findOne({ firstName: 'prateek', lastName: 'kumar' });
    const staffId = prateek._id.toString();
    console.log("Prateek ID:", staffId);
    
    // Replace 'lalit Cyberlim' with 'Maya Staff'
    const lalit = await User.findOne({ lastName: 'Cyberlim' });
    if (lalit) {
        console.log("Found lalit:", lalit._id);
        await User.updateOne({ _id: lalit._id }, { lastName: 'Staff', firstName: 'Maya' });
    } else {
        // search case insensitive
        const lalit2 = await User.findOne({ lastName: /cyberlim/i });
        if (lalit2) {
             console.log("Found lalit via regex:", lalit2._id);
             await User.updateOne({ _id: lalit2._id }, { lastName: 'Staff', firstName: 'Maya' });
        }
    }
    
    // Update facultyName in Timetable collection
    const timetables = await Timetable.find({}).lean();
    for (const tt of timetables) {
        if (!tt.schedule) continue;
        let changed = false;
        for (const dayPlan of tt.schedule) {
            if (dayPlan.slots) {
                for (const slot of dayPlan.slots) {
                    if (slot.facultyName && slot.facultyName.toLowerCase().includes('cyberlim')) {
                        slot.facultyName = 'Maya Staff';
                        changed = true;
                    }
                }
            }
        }
        if (changed) {
            await Timetable.updateOne({ _id: tt._id }, { schedule: tt.schedule });
            console.log("Updated timetable", tt._id);
        }
    }

    let weeklyClassesCount = 0;
    for (const tt of timetables) {
        if (!tt.schedule) continue;
        for (const dayPlan of tt.schedule) {
            if (dayPlan.slots) {
                const mySlots = dayPlan.slots.filter((s) => s.facultyUserId?.toString() === staffId);
                weeklyClassesCount += mySlots.length;
            }
        }
    }
    console.log("Weekly Classes Count for prateek:", weeklyClassesCount);
    
    process.exit(0);
}

main().catch(console.error);
