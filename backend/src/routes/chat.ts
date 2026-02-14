import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { createChat, getChats, getChatHistory, deleteChat, sendMessage } from "../controllers/chat.controller";
import upload from "../middlewares/upload";

const router = Router();

// Apply auth middleware to all chat routes
router.use(authenticate);

router.post("/", createChat);
router.get("/", getChats);
router.get("/:chatId", getChatHistory);
router.delete("/:chatId", deleteChat);

// Message handling (Task 8.2 placeholder)
router.post("/:chatId/messages", upload.single("image"), sendMessage);

export default router;
