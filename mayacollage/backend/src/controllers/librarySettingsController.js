import LibrarySettings from '../models/librarySettingsModel.js';

export const getSettings = async (req, res) => {
    try {
        let settings = await LibrarySettings.findOne();
        if (!settings) {
            settings = await LibrarySettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        let settings = await LibrarySettings.findOne();
        if (!settings) {
            settings = await LibrarySettings.create(req.body);
        } else {
            settings = await LibrarySettings.findByIdAndUpdate(settings._id, req.body, { new: true });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
