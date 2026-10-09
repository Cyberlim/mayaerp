import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true },
  intakeCapacity: { type: Number, required: true },
  coordinator: { type: String, required: true, trim: true },
  tuitionFee: { type: Number },
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
  feeStructureTemplate: [{
    year: { type: Number, required: true },
    totalYearlyFee: { type: Number, default: 0 },
    components: [{
      category: { type: String, required: true },
      amount: { type: Number, default: 0 },
      isMandatory: { type: Boolean, default: true },
      frequency: { type: String, default: "Annual" },
      months: [String]
    }]
  }],
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
