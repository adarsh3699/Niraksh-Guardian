import { SNSClient } from "@aws-sdk/client-sns";
import env from "./env";

const snsClient = new SNSClient({
	region: env.AWS_REGION,
	credentials:
		env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
			? {
					accessKeyId: env.AWS_ACCESS_KEY_ID,
					secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
				}
			: undefined,
});

export default snsClient;
