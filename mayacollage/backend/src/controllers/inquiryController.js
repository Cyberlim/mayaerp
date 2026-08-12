import { Inquiry } from '../models/inquiryModel.js';

export const createInquiry = async (req, res) => {
    try {
        const inquiryData = req.body;
        
        // Handle avatar if not provided (same as UI avatars)
        if (!inquiryData.avatar && inquiryData.name) {
            inquiryData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(inquiryData.name)}&background=random`;
        }

        const inquiry = new Inquiry(inquiryData);
        await inquiry.save();
        
        res.status(201).json(inquiry);
    } catch (error) {
        console.error("Error creating inquiry:", error);
        res.status(500).json({ message: 'Error creating inquiry', error: error.message });
    }
};

export const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.status(200).json(inquiries);
    } catch (error) {
        console.error("Error fetching inquiries:", error);
        res.status(500).json({ message: 'Error fetching inquiries', error: error.message });
    }
};

export const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );
        
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json(inquiry);
    } catch (error) {
        console.error("Error updating inquiry status:", error);
        res.status(500).json({ message: 'Error updating inquiry status', error: error.message });
    }
};

export const deleteInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        console.error("Error deleting inquiry:", error);
        res.status(500).json({ message: 'Error deleting inquiry', error: error.message });
    }
};
