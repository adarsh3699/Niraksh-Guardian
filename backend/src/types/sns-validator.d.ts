declare module "sns-validator" {
	class Validator {
		validate(
			message: Record<string, unknown>,
			callback: (err: Error | null, message: Record<string, unknown>) => void
		): void;
	}
	export default Validator;
}
