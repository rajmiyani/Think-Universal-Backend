// models/BankDetails.model.js
import mongoose from "mongoose";
import { adminDB } from "../config/mongoose.js";

const BankDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      minlength: [3, "Account name must be at least 3 characters"],
      maxlength: [100, "Account name cannot exceed 100 characters"],
      match: [/^[a-zA-Z\s.]+$/, "Account name can only contain letters, spaces, and dots"],
    },

    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      trim: true,
      minlength: [9, "Account number must be at least 9 digits"],
      maxlength: [20, "Account number cannot exceed 20 digits"],
      match: [/^\d+$/, "Account number must contain only numbers"],
    },

    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
      minlength: [3, "Bank name must be at least 3 characters"],
      maxlength: [100, "Bank name cannot exceed 100 characters"],
    },

    bankAddress: {
      type: String,
      required: [true, "Bank address is required"],
      trim: true,
      minlength: [5, "Bank address must be at least 5 characters"],
      maxlength: [255, "Bank address cannot exceed 255 characters"],
    },

    ibanNumber: {
      type: String,
      required: [true, "IBAN number is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, "Invalid IBAN format"],
    },

    typeOfAccount: {
      type: String,
      enum: {
        values: ["Savings", "Current"],
        message: "Type of account must be either 'Savings' or 'Current'",
      },
      required: [true, "Type of account is required"],
    },
  },
  { timestamps: true }
);

export default adminDB.model("BankDetails", BankDetailsSchema);
