import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
    enrollmentNumber: { type: String, unique: true, sparse: true },
    admissionNumber: { type: String, unique: true, sparse: true },
    studentId: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    libraryPin: { type: String }, // Hashed 4-digit PIN for self-checkout
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    
    // Personal Details
    applicantPhoto: { type: String },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    email: { type: String },
    mobile: { type: String, required: true },
    parentMobile: { type: String },
    alternateMobile: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String },
    aadharNumber: { type: String },
    religion: { type: String },
    entryType: { type: String, enum: ['Direct', 'Lateral'], default: 'Direct' },

    // Academic Info
    highestQualification: { type: String },
    institutionName: { type: String },
    boardUniversity: { type: String },
    percentageCGPA: { type: String },
    yearOfPassing: { type: String },
    subjectMarks: {
        subject1: { type: String },
        subject2: { type: String },
        subject3: { type: String }
    },
    entranceScore: { type: String },

    // Program Selection
    selectedBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    selectedProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    selectedSemester: { type: Number, default: 1 },
    selectedSection: { type: String },
    sessionYear: { type: String },
    admissionYear: { type: String },
    batch: { type: String },
    courseYear: { type: Number },
    category: { type: String },
    statementOfPurpose: { type: String },

    // Fees Structure
    fees: {
        isConfigured: { type: Boolean, default: false },
        years: [{
            year: { type: Number, required: true },
            tuition: {
                total: { type: Number, default: 0 },
                paid: { type: Number, default: 0 }
            },
            exam: {
                total: { type: Number, default: 0 },
                paid: { type: Number, default: 0 }
            },
            other: {
                total: { type: Number, default: 0 },
                paid: { type: Number, default: 0 }
            }
        }]
    },

    // Documents (Cloudinary URLs) — uploaded by student from their panel
    documents: {
        studentPhoto:         { type: String },
        marksheet10:          { type: String },
        marksheet12:          { type: String },
        transferCertificate:  { type: String },
        aadharCard:           { type: String },
        casteCertificate:     { type: String },
        migrationCertificate: { type: String },
        entranceScoreCard:    { type: String },
        otherDocument:        { type: String },
    },
    documentsLastUpdated: { type: Date },

    status: {
        type: String,
        default: 'Approved'
    },
    studentStatus: {
        type: String,
        enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
        default: 'Active'
    },
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password and calculate academic classification
studentSchema.pre('save', async function() {
    try {
        // Calculate Academic Classification Fields
        if (!this.admissionYear && this.sessionYear) {
            this.admissionYear = this.sessionYear.split('-')[0];
        }

        if (this.selectedProgram && this.admissionYear && (!this.batch || !this.courseYear)) {
            const Course = mongoose.model('Course');
            const course = await Course.findById(this.selectedProgram);
            
            if (course) {
                const duration = course.duration || 4; // default to 4 years if not set
                const endYear = parseInt(this.admissionYear) + duration;
                const calculatedSession = `${this.admissionYear}-${endYear.toString().slice(-2)}`;
                
                if (!this.batch) {
                    this.batch = calculatedSession;
                }
                
                // Automatically set sessionYear so it shows correctly in student app
                if (!this.sessionYear) {
                    this.sessionYear = calculatedSession;
                }
            }
        }

        if (!this.courseYear && this.selectedSemester) {
            this.courseYear = Math.ceil(this.selectedSemester / 2);
        }

        // Hash Password
        if (this.isModified('password') && this.password) {
            if (!(this.password.startsWith('$2b$') || this.password.startsWith('$2a$'))) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }
        }

        // Hash Library PIN
        if (this.isModified('libraryPin') && this.libraryPin) {
            if (!(this.libraryPin.startsWith('$2b$') || this.libraryPin.startsWith('$2a$'))) {
                const salt = await bcrypt.genSalt(10);
                this.libraryPin = await bcrypt.hash(this.libraryPin, salt);
            }
        }
    } catch (err) {
        throw err;
    }
});

// Method to compare password for login
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare library pin
studentSchema.methods.compareLibraryPin = async function(candidatePin) {
    if (!this.libraryPin) return false;
    return await bcrypt.compare(candidatePin, this.libraryPin);
};

export const Student = mongoose.model('Student', studentSchema);
