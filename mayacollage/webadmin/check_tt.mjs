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

async function main() {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    const tts = await Timetable.find({}).lean();
    console.log("Total Timetables:", tts.length);
    for (const tt of tts) {
        let staffFound = new Set();
        if (tt.schedule) {
            for (const day of tt.schedule) {
                if (day.slots) {
                    for (const slot of day.slots) {
                        if (slot.facultyUserId) {
                            staffFound.add(slot.facultyUserId.toString() + ' (' + slot.facultyName + ')');
                        }
                    }
                }
            }
        }
        console.log("TT for course", tt.courseId, "- Staff in this TT:", Array.from(staffFound));
    }
    process.exit(0);
}

main().catch(console.error);
