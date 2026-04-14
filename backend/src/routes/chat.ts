import { Router } from "express";
import { chatRateLimiter } from "../middlewares/rateLimiter";
import { authenticate } from "../middlewares/auth";
import {
	createChat,
	getChats,
	getChatHistory,
	updateChat,
	deleteChat,
	sendMessage,
	sendMessageStream,
} from "../controllers/chat.controller";
import upload from "../middlewares/upload";

const router = Router();

// Apply auth middleware to all chat routes
router.use(authenticate);

router.post("/", createChat);
router.get("/", getChats);
router.get("/:chatId", getChatHistory);
router.put("/:chatId", updateChat);
router.delete("/:chatId", deleteChat);

// Message handling
router.post("/:chatId/messages/stream", chatRateLimiter, upload.single("image"), sendMessageStream);
router.post("/:chatId/messages", chatRateLimiter, upload.single("image"), sendMessage);

export default router;
