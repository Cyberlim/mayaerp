import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    deanName: {
        type: String,
        required: true,
        trim: true
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true
    },
    contactExt: {
        type: String,
        trim: true
    },
    iconName: {
        type: String,
        default: 'business_center_rounded' // Store a flutter icon name or random identifier
    },
    colorHex: {
        type: String,
        default: '#4F46E5' // Store a flutter color hex
    },
    location: {
        type: String,
        required: true
    },
    establishedYear: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
