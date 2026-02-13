import pino from "pino";
import env from "./env";

const logger = pino({
	name: "niraksh-guardian",
	level: env.NODE_ENV === "production" ? "info" : "debug",
	transport:
		env.NODE_ENV === "development"
			? {
					target: "pino/file",
					options: { destination: 1 }, // stdout
				}
			: undefined,
	formatters: {
		level(label) {
			return { level: label };
		},
	},
	timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
