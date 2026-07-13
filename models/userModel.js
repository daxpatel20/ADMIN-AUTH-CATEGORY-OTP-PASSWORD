const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        forgotPasswordOtp: {
            type: String,
            default: ""
        },
        forgotPasswordToken: {
            type: String,
            default: ""
        },
        forgotPasswordOtpExpires: {
            type: Date,
            default: null
        },
        forgotPasswordResendAt: {
            type: Date,
            default: null
        },
        forgotPasswordVerified: {
            type: Boolean,
            default: false
        },
        profileImage: {
            type: String,
            default: ""
        },
        birthYear: {
            type: String,
            default: "",
            trim: true
        },
        gender: {
            type: String,
            default: "",
            trim: true
        },
        country: {
            type: String,
            default: "",
            trim: true
        },
        state: {
            type: String,
            default: "",
            trim: true
        },
        address: {
            type: String,
            default: "",
            trim: true
        },
        facebook: {
            type: String,
            default: "",
            trim: true
        },
        instagram: {
            type: String,
            default: "",
            trim: true
        },
        linkedin: {
            type: String,
            default: "",
            trim: true
        },
        github: {
            type: String,
            default: "",
            trim: true
        }
    },

);

module.exports = mongoose.model("User", userSchema);
