import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    busNo: {
        type: String,
        required: true,
        unique: true
    },
    driverName: {
        type: String,
        required: true
    },
    conductorName: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    filled: {
        type: Number,
        default: 0
    },
    routeName: {
        type: String,
        required: true
    },
    stops: [{
        stationName: { type: String, required: true },
        price: { type: Number, required: true, default: 0 }
    }],
    status: {
        type: String,
        enum: ['Active', 'Full', 'Service'],
        default: 'Active'
    },
    students: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        stopName: { type: String },
        fare: { type: Number },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid'],
            default: 'Pending'
        },
        paymentDate: { type: Date },
        transactionId: { type: String }
    }]
}, {
    timestamps: true
});

// Update status based on occupancy
busSchema.pre('save', function() {
    if (this.filled >= this.capacity) {
        this.status = 'Full';
    } else if (this.status === 'Full') {
        this.status = 'Active';
    }
});

const Bus = mongoose.model('Bus', busSchema);
export default Bus;
