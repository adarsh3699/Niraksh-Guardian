const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    role: { type: String, required: true },
    parts: [{
        text: { type: String, required: true }
    }]
});

const chatSchema = mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    messages: [messageSchema],
}, { 
    timestamps: true 
});

module.exports = mongoose.model("Chat", chatSchema); 