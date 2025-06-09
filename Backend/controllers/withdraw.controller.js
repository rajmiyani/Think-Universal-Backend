// controllers/withdraw.controller.js
import Razorpay from "razorpay";
import BankDetails from "../models/BankDetails.model.js";
import Transaction from "../models/Transaction.model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

export const withdrawMoney = async (req, res) => {
    try {
        const { amount, bankDetailsId } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!amount || !bankDetailsId) {
            return res.status(400).json({ message: "Amount and bank details required" });
        }

        if (amount < 100) {
            return res.status(400).json({ message: "Minimum withdrawal is ₹100" });
        }

        const bank = await BankDetails.findOne({ _id: bankDetailsId, userId });
        if (!bank) {
            return res.status(404).json({ message: "Bank details not found" });
        }

        // Optional: Check wallet balance before withdrawal here

        const payout = await razorpay.payouts.create({
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your virtual account number
            fund_account: {
                account_type: "bank_account",
                bank_account: {
                    name: bank.accountName,
                    ifsc: "HDFC0000123", // Use IFSC or SWIFT code
                    account_number: bank.accountNumber
                },
                contact: {
                    name: bank.accountName,
                    type: "employee",
                    email: "example@email.com",
                    contact: "9123456789"
                }
            },
            amount: amount * 100,
            currency: "INR",
            mode: "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
        });

        const transaction = await Transaction.create({
            userId,
            amount,
            razorpayPayoutId: payout.id,
            status: payout.status,
            bankDetailsId
        });

        res.status(200).json({ success: true, message: "Withdrawal initiated", transaction });

    } catch (error) {
        console.error("Withdraw Error:", error);
        res.status(500).json({ message: "Withdrawal failed", error: error.message });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId }).populate("bankDetailsId").sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: transactions });
    } catch (err) {
        console.error("Transaction History Error:", err);
        res.status(500).json({ message: "Failed to get transaction history" });
    }
};