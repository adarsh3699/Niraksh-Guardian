declare module "sns-validator" {
	export default class Validator {
		validate(body: any, callback: (err: any, message: any) => void): void;
	}
}
