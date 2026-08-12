import InventoryItem from '../models/inventoryItemModel.js';

// @desc Get all inventory items
export const getAllItems = async (req, res) => {
    try {
        const { lab, category, condition, search } = req.query;
        const filter = {};
        if (lab) filter.lab = lab;
        if (category) filter.category = category;
        if (condition) filter.condition = condition;
        if (search) filter.itemName = { $regex: search, $options: 'i' };

        const items = await InventoryItem.find(filter)
            .populate('lab', 'labName roomNumber labType');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Get single item
export const getItemById = async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id).populate('lab', 'labName roomNumber');
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Create an inventory item
export const createItem = async (req, res) => {
    try {
        const item = await InventoryItem.create(req.body);
        const populated = await item.populate('lab', 'labName roomNumber');
        res.status(201).json({ message: 'Item added to inventory', item: populated });
    } catch (error) {
        console.error('Create Inventory Item Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Update an inventory item
export const updateItem = async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('lab', 'labName roomNumber');
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item updated', item });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Delete an inventory item
export const deleteItem = async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted from inventory' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Get low stock items
export const getLowStockItems = async (req, res) => {
    try {
        const items = await InventoryItem.find({
            $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] }
        }).populate('lab', 'labName roomNumber');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
