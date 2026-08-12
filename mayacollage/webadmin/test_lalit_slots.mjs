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
            startTime: String,
            endTime: String,
        }]
    }]
});

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

async function main() {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    
    const staffId = '6a7449de2378f731cdd5650d'; // lalit's ID
    const timetables = await Timetable.find({ targetType: "Class" }).lean();
    
    for (const tt of timetables) {
        if (!tt.schedule) continue;
        for (const dayPlan of tt.schedule) {
            if (!dayPlan.slots) continue;
            const mySlots = dayPlan.slots.filter((s) => s.facultyUserId?.toString() === staffId);
            for (const slot of mySlots) {
                console.log(`Slot on ${dayPlan.day}: startTime = ${slot.startTime}, endTime = ${slot.endTime}`);
            }
        }
    }
    process.exit(0);
}

main().catch(console.error);
