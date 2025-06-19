import express from 'express';
import {
    createMode,
    getAllModes,
    toggleModeStatus
} from '../controllers/mode.controller.js';

const router = express.Router();

router.post('/create', createMode);
router.get('/list', getAllModes);
router.patch('/toggle/:id', toggleModeStatus);

export default router;
