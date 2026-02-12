const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    id: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: false },
    gender: { type: String, required: false },
    linkWithGoogle: { type: Boolean, required: true },
    linkWithPassword: { type: Boolean, required: true },
    createdOn: { type: Date, required: true },
    lastLogin: { type: Date, required: false },
    refreshToken: { type: String, required: false },
    refreshTokenExpiresAt: { type: Date, required: false }
});

module.exports = mongoose.model("User", userSchema);