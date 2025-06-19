import express from 'express';
import {
    createMode,
    getAllModes,
    toggleModeStatus
} from '../controllers/mode.controller.js';

const router = express.Router();

router.post('/createMode', createMode);
router.get('/getAllModes', getAllModes);
router.patch('/toggleStatus/:id', toggleModeStatus);

export default router;
