import express from 'express';
import {
    createMode,
    getAllModes,
    toggleModeStatus
} from '../controllers/mode.controller.js';
import { verifyToken } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/createMode',verifyToken, createMode);
router.get('/getAllModes',verifyToken, getAllModes);
router.patch('/toggleStatus/:id', toggleModeStatus);

export default router;
