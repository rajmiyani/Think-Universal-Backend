import multer from 'multer';

// Store files in memory as Buffer (for further processing, e.g., upload to cloud)
const storage = multer.memoryStorage();

// Allowed file extensions and MIME types
const allowedExtensions = ['jpeg', 'jpg', 'png', 'pdf'];
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
];

// File filter with full validation
const fileFilter = (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isExtensionAllowed = allowedExtensions.includes(ext);
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);

    if (isExtensionAllowed && isMimeTypeAllowed) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Only files with extensions jpeg, jpg, png, or pdf and correct MIME types are allowed'
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

// Optional: Express error handler for Multer errors
export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        // Other errors
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

export default upload;