import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true },
    itemCode: { type: String, unique: true, sparse: true },
    category: {
        type: String,
        required: true,
        enum: ['Equipment', 'Electronics', 'Microcontroller', 'Chemical', 'Computer', 'Consumable', 'Furniture', 'Other']
    },
    quantity: { type: Number, required: true, default: 0 },
    availableQuantity: { type: Number, default: 0 },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'LabFacility', required: true },
    condition: {
        type: String,
        enum: ['Good', 'Needs Repair', 'Damaged', 'Lost', 'Disposed'],
        default: 'Good'
    },
    lowStockThreshold: { type: Number, default: 5 },
    description: { type: String },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number },
    vendor: { type: String },
    isIssuable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Auto-set availableQuantity on create
inventoryItemSchema.pre('save', function () {
    if (this.isNew && this.availableQuantity === 0) {
        this.availableQuantity = this.quantity;
    }
    this.updatedAt = new Date();
});

export default mongoose.model('InventoryItem', inventoryItemSchema);
