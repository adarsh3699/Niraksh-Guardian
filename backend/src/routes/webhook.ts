import { Router } from "express";
import { handleSesWebhook } from "../controllers/webhook.controller";
import express from "express";

const router = Router();

// SNS might send text/plain. We need to handle it.
// We can use express.json({ type: ['application/json', 'text/plain'] }) specifically for this router or handler.
// But doing it globally might have side effects.
// Let's add parser here.

router.post("/ses-events", express.json({ type: ["application/json", "text/plain"] }), handleSesWebhook);

export default router;
