import express from "express";
import { addBankDetails, withdrawMoney, getTransactionHistory } from "../controllers/withdraw.controller.js";
import { verifyToken } from "../middleware/admin.middlware.js";

const router = express.Router();

router.post("/addBankDetails", verifyToken, addBankDetails);
router.post("/moneyWithdraw", verifyToken, withdrawMoney);
router.get("/history", verifyToken, getTransactionHistory);

export default router;
