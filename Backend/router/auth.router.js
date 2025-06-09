import express from 'express';
import { loginDoctor, forgotPassword, updatePassword } from '../controllers/auth.controller.js';
// import upload from '../multer.js';

// import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// router.post('/register', upload.single('img'), registerDoctor);
router.post('/login', loginDoctor);
router.post('/forgotPassword', forgotPassword);
router.post('/updatePassword', updatePassword);

export default router;