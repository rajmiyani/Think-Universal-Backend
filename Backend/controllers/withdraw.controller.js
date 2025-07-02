// controllers/withdraw.controller.js
import Razorpay from "razorpay";
import Transaction from "../models/Transaction.model.js";
import BankDetails from "../models/BankDetails.model.js";
import { razorpay } from "../razorpay.js";
import doctorModel from "../models/doctor.model.js";

export const addBankDetails = async (req, res) => {
    try {
        const {
            mobile,
            accountName,
            accountNumber,
            bankName,
            bankAddress,
            ibanNumber,
            typeOfAccount
        } = req.body;

        // ✅ Step 1: Find doctor by mobile
        const doctor = await doctorModel.findOne({ phoneNo: mobile });
        console.log("Doctor :", doctor);


        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found with this mobile number"
            });
        }

        const userId = doctor._id; // Use doctor's ID as userId

        // ✅ Step 2: Check if already exists
        const alreadyExists = await BankDetails.findOne({ userId });
        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: "Bank details already added. Please update instead."
            });
        }

        // ✅ Step 3: Create new bank entry
        const newBank = await BankDetails.create({
            userId,
            accountName,
            accountNumber,
            bankName,
            bankAddress,
            ibanNumber,
            typeOfAccount
        });

        res.status(201).json({
            success: true,
            message: "Bank details added successfully",
            bankDetails: newBank
        });

    } catch (err) {
        console.error("Add Bank Error:", err);
        res.status(500).json({ success: false, message: "Failed to add bank details", error: err.message });
    }
};

export const withdrawMoney = async (req, res) => {
    try {
        const { mobile, amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const doctor = await doctorModel.findOne({ phoneNo: mobile });
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found with this mobile number" });
        }

        const userId = doctor._id;
        const userEmail = doctor.email;

        // Razorpay Balance Check
        const balanceResponse = await razorpay.accounts.fetchBalance();
        const availableBalance = balanceResponse.balance / 100;

        if (amount > availableBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient Razorpay balance. Available: ₹${availableBalance}`
            });
        }

        const bank = await BankDetails.findOne({ userId });
        if (!bank) {
            return res.status(403).json({ success: false, message: "Bank details not found. Please add them first." });
        }

        const contact = await razorpay.contacts.create({
            name: bank.accountName,
            email: userEmail || "default@noemail.com",
            type: "employee",
        });

        const fundAccount = await razorpay.fundAccount.create({
            contact_id: contact.id,
            account_type: "bank_account",
            bank_account: {
                name: bank.accountName,
                ifsc: bank.ibanNumber.slice(-11),
                account_number: bank.accountNumber
            }
        });

        const payout = await razorpay.payouts.create({
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: fundAccount.id,
            amount: amount * 100,
            currency: "INR",
            mode: "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: "txn_" + Date.now(),
            narration: "Doctor Withdrawal"
        });

        const transaction = await Transaction.create({
            userId,
            amount,
            status: "Success",
            razorpayPayoutId: payout.id,
            bankDetailsId: bank._id
        });

        res.status(200).json({
            success: true,
            message: "Withdrawal successful",
            payout,
            transaction
        });

    } catch (err) {
        console.error("Withdraw Error:", err);
        res.status(500).json({ success: false, message: "Withdrawal failed", error: err.message });
    }
};


export const getTransactionHistory = async (req, res) => {
    try {
        const { mobile } = req.body;

        const doctor = await doctorModel.findOne({ phoneNo: mobile });
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const userId = doctor._id;

        const transactions = await Transaction.find({ userId })
            .populate("bankDetailsId")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: transactions });

    } catch (err) {
        console.error("Transaction History Error:", err);
        res.status(500).json({ message: "Failed to get transaction history", error: err.message });
    }
};
