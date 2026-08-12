import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    targetType: { type: String, enum: ['Class', 'Teacher'], default: 'Class' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    semester: { type: Number },
    section: { type: String, default: 'Section A' },
    schedule: [{
        day: { type: String },
        slots: [{
            subject: String,
            facultyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            facultyName: String,
            classInfo: String,
            startTime: String,
            endTime: String,
            location: String,
            type: { type: String, default: 'Lecture' }
        }]
    }]
}, { timestamps: true });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

async function main() {
  await mongoose.connect("mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/");
  const tts = await Timetable.find().lean();
  console.log(JSON.stringify(tts, null, 2));
  process.exit(0);
}
main();
