import app from "./app";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const logger = pino();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	logger.info(`Server running on port ${PORT}`);
});
