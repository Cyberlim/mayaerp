import { Application } from '../models/applicationModel.js';

export const createApplication = async (req, res) => {
    try {
        const applicationData = req.body;
        
        // Merge Cloudinary URLs from middleware ONLY if files were actually uploaded
        if (req.documentUrls) {
            if (req.documentUrls.applicantPhoto) {
                applicationData.applicantPhoto = req.documentUrls.applicantPhoto;
            }
            
            if (!applicationData.documents) applicationData.documents = {};
            
            if (req.documentUrls.marksheet10) applicationData.documents.marksheet10 = req.documentUrls.marksheet10;
            if (req.documentUrls.marksheet12) applicationData.documents.marksheet12 = req.documentUrls.marksheet12;
            if (req.documentUrls.transferCertificate) applicationData.documents.transferCertificate = req.documentUrls.transferCertificate;
            if (req.documentUrls.aadharCard) applicationData.documents.aadharCard = req.documentUrls.aadharCard;
            if (req.documentUrls.entranceScoreCard) applicationData.documents.entranceScoreCard = req.documentUrls.entranceScoreCard;
        }

        const newApplication = new Application(applicationData);
        await newApplication.save();

        res.status(201).json({
            message: 'Application submitted successfully',
            application: newApplication
        });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({
            message: 'Error submitting application',
            error: error.message
        });
    }
};

export const getApplications = async (req, res) => {
    try {
        const applications = await Application.find().sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching applications',
            error: error.message
        });
    }
};

export const getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching application',
            error: error.message
        });
    }
};

export const updateApplication = async (req, res) => {
    try {
        const applicationData = req.body;
        
        // Merge Cloudinary URLs from middleware ONLY if files were actually uploaded
        if (req.documentUrls) {
            if (req.documentUrls.applicantPhoto) {
                applicationData.applicantPhoto = req.documentUrls.applicantPhoto;
            }
            
            if (!applicationData.documents) applicationData.documents = {};
            
            if (req.documentUrls.marksheet10) applicationData.documents.marksheet10 = req.documentUrls.marksheet10;
            if (req.documentUrls.marksheet12) applicationData.documents.marksheet12 = req.documentUrls.marksheet12;
            if (req.documentUrls.transferCertificate) applicationData.documents.transferCertificate = req.documentUrls.transferCertificate;
            if (req.documentUrls.aadharCard) applicationData.documents.aadharCard = req.documentUrls.aadharCard;
            if (req.documentUrls.entranceScoreCard) applicationData.documents.entranceScoreCard = req.documentUrls.entranceScoreCard;
        }

        const updatedApplication = await Application.findByIdAndUpdate(
            req.params.id,
            applicationData,
            { new: true, runValidators: true }
        );

        if (!updatedApplication) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({
            message: 'Application updated successfully',
            application: updatedApplication
        });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({
            message: 'Error updating application',
            error: error.message
        });
    }
};

export const deleteApplication = async (req, res) => {
    try {
        const deletedApplication = await Application.findByIdAndDelete(req.params.id);
        if (!deletedApplication) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.status(200).json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting application',
            error: error.message
        });
    }
};
