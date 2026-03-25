import { Router } from "express";
import { medicineAutocompleteController, medicineImageProxyController } from "../controllers/medicine.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/autocomplete", authenticate, medicineAutocompleteController);
router.get("/image-proxy", authenticate, medicineImageProxyController);

export default router;
