// models/Transaction.model.js
import mongoose from "mongoose";
import { adminDB } from "../config/mongoose.js";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least ₹1"],
      validate: {
        validator: Number.isFinite,
        message: "Amount must be a valid number",
      },
    },

    status: {
      type: String,
      enum: {
        values: ["Pending", "Success", "Failed"],
        message: "Status must be either Pending, Success, or Failed",
      },
      default: "Pending",
    },

    razorpayPayoutId: {
      type: String,
      trim: true,
      maxlength: [100, "Razorpay Payout ID cannot exceed 100 characters"],
      match: [
        /^[a-zA-Z0-9_-]*$/,
        "Razorpay Payout ID can only contain letters, numbers, hyphens, and underscores",
      ],
    },

    bankDetailsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetails",
      required: [true, "Bank details reference is required"],
    },
  },
  { timestamps: true }
);

export default adminDB.model("Transaction", transactionSchema);
