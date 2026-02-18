import pino from "pino";
import env from "./env";

const isDev = env.NODE_ENV === "development";

const logger = pino({
	name: "niraksh-guardian",
	level: isDev ? "debug" : "info",
	transport: isDev
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss",
					ignore: "pid,hostname,name",
					singleLine: false,
				},
			}
		: undefined,
	...(!isDev && {
		formatters: { level: (label: string) => ({ level: label }) },
		timestamp: pino.stdTimeFunctions.isoTime,
	}),
});

export default logger;
