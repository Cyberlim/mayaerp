import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  // Personal Details
  applicantPhoto: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },

  // Academic Info
  highestQualification: { type: String, required: true },
  institutionName: { type: String, required: true },
  boardUniversity: { type: String, required: true },
  percentageCGPA: { type: String, required: true },
  yearOfPassing: { type: String, required: true },
  subjectMarks: {
    subject1: { type: String },
    subject2: { type: String },
    subject3: { type: String },
  },
  entranceScore: { type: String },

  // Program Selection
  selectedBranch: { type: String },
  selectedProgram: { type: String, required: true },
  sessionYear: { type: String, required: true },
  category: { type: String, required: true },
  statementOfPurpose: { type: String },

  // Documents (URLs)
  documents: {
    marksheet10: { type: String },
    marksheet12: { type: String },
    transferCertificate: { type: String },
    aadharCard: { type: String },
    entranceScoreCard: { type: String },
  },

  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Accepted", "Rejected", "Approved"], // Added Approved to match our UI state
    default: "Pending",
  },
  password: { type: String },
  studentId: { type: String, unique: true, sparse: true },
  admissionNumber: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

export const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
