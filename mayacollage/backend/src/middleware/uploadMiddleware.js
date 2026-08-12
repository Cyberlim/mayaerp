import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

// Multer setup - store in memory for processing with sharp
const storage = multer.memoryStorage();
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for initial upload
    }
});

// Utility to upload to Cloudinary using a stream
const uploadToCloudinary = (buffer, folder = 'maya_erp') => {
    return new Promise((resolve, reject) => {
        let cld_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'Portfolio'
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
    });
};

// Middleware to optimize and upload image
export const processAndUploadImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Optimize image with sharp
        // We start with high quality and lower it if needed, or just set a reasonable target
        let quality = 80;
        let buffer = await sharp(req.file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }) // Reasonable max size
            .jpeg({ quality: quality, progressive: true, mozjpeg: true })
            .toBuffer();

        // Check size and compress further if > 300KB
        while (buffer.length > 300 * 1024 && quality > 20) {
            quality -= 10;
            buffer = await sharp(req.file.buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: quality, progressive: true, mozjpeg: true })
                .toBuffer();
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer);
        
        // Attach the URL to the request object
        req.cloudinaryUrl = result.secure_url;
        next();
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ message: 'Error processing image', error: error.message });
    }
};

// Multi-file upload handler for applications
export const processApplicationDocuments = async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }

    try {
        const uploadResults = {};
        
        for (const [fieldName, fileArray] of Object.entries(req.files)) {
            const file = fileArray[0];
            let buffer = file.buffer;
            
            // Optimize only if it's an image
            if (file.mimetype && file.mimetype.startsWith('image/')) {
                let quality = 80;
                buffer = await sharp(file.buffer)
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: quality, progressive: true, mozjpeg: true })
                    .toBuffer();

                while (buffer.length > 300 * 1024 && quality > 20) {
                    quality -= 10;
                    buffer = await sharp(file.buffer)
                        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: quality, progressive: true, mozjpeg: true })
                        .toBuffer();
                }
            }

            // Upload to Cloudinary
            const result = await uploadToCloudinary(buffer, 'applications');
            uploadResults[fieldName] = result.secure_url;
        }

        req.documentUrls = uploadResults;
        next();
    } catch (error) {
        console.error('Error processing documents:', error);
        res.status(500).json({ message: 'Error processing documents', error: error.message });
    }
};
