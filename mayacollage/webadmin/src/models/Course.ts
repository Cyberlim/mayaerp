import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true },
  intakeCapacity: { type: Number, required: true },
  coordinator: { type: String, required: true, trim: true },
  tuitionFee: { type: Number, required: true },
  labIndex: { type: String, trim: true },
  curriculum: [{
    semester: Number,
    credits: Number,
    description: String,
    sections: [{
      name: { type: String },
      subjects: [{
        name: String,
        code: String,
        credits: Number,
        type: { type: String, default: "Core" },
        facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      }],
    }],
  }],
  totalSemesters: { type: Number, default: 8 },
  semesterFees: [{
    semester: Number,
    fee: Number,
  }],
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
