const express = require("express");
const router = express.Router();
const Chat = require("../models/chatModel");
const mongoose = require("mongoose");

// GET all chats for the current user
router.get("/", async (req, res) => {
    try {
        // Access userId from auth payload
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(400).json({ statusCode: 400, msg: "User ID not found in token" });
        }
        
        const chats = await Chat.find({ userId })
            .sort({ updatedAt: -1 }) // Sort by latest updated first
            .select('title messages createdAt updatedAt');
            
        return res.status(200).json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({ statusCode: 500, msg: "Server error" });
    }
});

// GET a single chat by ID
router.get("/:id", async (req, res) => {
    try {
        // Access userId from auth payload
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(400).json({ statusCode: 400, msg: "User ID not found in token" });
        }
        
        const chatId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ statusCode: 400, msg: "Invalid chat ID" });
        }
        
        const chat = await Chat.findOne({ _id: chatId, userId });
        
        if (!chat) {
            return res.status(404).json({ statusCode: 404, msg: "Chat not found" });
        }
        
        return res.status(200).json(chat);
    } catch (error) {
        console.error("Error fetching chat:", error);
        return res.status(500).json({ statusCode: 500, msg: "Server error" });
    }
});

// CREATE a new chat
router.post("/", async (req, res) => {
    try {
        // Access userId from auth payload
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(400).json({ statusCode: 400, msg: "User ID not found in token" });
        }
        
        console.log("Creating chat with userId:", userId);
        
        const { title, messages } = req.body;
        
        if (!title) {
            return res.status(400).json({ statusCode: 400, msg: "Title is required" });
        }
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ statusCode: 400, msg: "At least one message is required" });
        }
        
        const newChat = new Chat({
            userId,
            title,
            messages
        });
        
        await newChat.save();
        
        return res.status(201).json(newChat);
    } catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ statusCode: 500, msg: "Server error" });
    }
});

// UPDATE a chat
router.put("/:id", async (req, res) => {
    try {
        // Access userId from auth payload
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(400).json({ statusCode: 400, msg: "User ID not found in token" });
        }
        
        const chatId = req.params.id;
        const { title, messages } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ statusCode: 400, msg: "Invalid chat ID" });
        }
        
        // Create an update object with only the fields that are provided
        const updateData = {};
        if (title) updateData.title = title;
        if (messages) updateData.messages = messages;
        
        const updatedChat = await Chat.findOneAndUpdate(
            { _id: chatId, userId },
            updateData,
            { new: true } // Return the updated document
        );
        
        if (!updatedChat) {
            return res.status(404).json({ statusCode: 404, msg: "Chat not found" });
        }
        
        return res.status(200).json(updatedChat);
    } catch (error) {
        console.error("Error updating chat:", error);
        return res.status(500).json({ statusCode: 500, msg: "Server error" });
    }
});

// DELETE a chat
router.delete("/:id", async (req, res) => {
    try {
        // Access userId from auth payload
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(400).json({ statusCode: 400, msg: "User ID not found in token" });
        }
        
        const chatId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ statusCode: 400, msg: "Invalid chat ID" });
        }
        
        const result = await Chat.findOneAndDelete({ _id: chatId, userId });
        
        if (!result) {
            return res.status(404).json({ statusCode: 404, msg: "Chat not found" });
        }
        
        return res.status(200).json({ statusCode: 200, msg: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        return res.status(500).json({ statusCode: 500, msg: "Server error" });
    }
});

module.exports = router; 