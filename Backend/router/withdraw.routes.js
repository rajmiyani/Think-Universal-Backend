// routes/withdraw.routes.js
import express from "express";
import { withdrawMoney } from "../controllers/withdraw.controller.js";
import { getTransactionHistory } from "../controllers/history.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/withdraw", verifyToken, withdrawMoney);
router.get("/history", verifyToken, getTransactionHistory);

export default router;
